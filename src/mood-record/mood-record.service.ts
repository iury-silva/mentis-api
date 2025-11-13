import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import FormData from 'form-data';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { promises as fs } from 'fs';
import { join } from 'path';
import OpenAI from 'openai';
import { CreateMoodDto } from './dto/create-mood-dto';
import { PrismaService } from 'src/database/prisma.service';

ffmpeg.setFfmpegPath(ffmpegPath as string);

type FetchedData = {
  status: string;
};

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface MoodAnalysisResponse {
  score_mood: number;
  score_anxiety: number;
  score_energy: number;
  score_sleep: number;
  score_stress: number;
  notes?: string;
  transcripted_audio?: string;
  ai_insight: string;
  ai_features?: VoiceMetricsAnalysis;
}

interface VoiceMetricsAnalysis {
  [key: string]: number | number[]; // Assinatura de índice para compatibilidade com Prisma JSON
  duration_seconds: number;
  rms: number;
  tempo_bpm: number;
  mfccs_mean: number[];
  spectral_centroid: number;
  spectral_bandwidth: number;
  rolloff: number;
  zcr: number;
  pitch_mean: number;
  pitch_std: number;
  jitter_local: number;
  shimmer_local: number;
  hnr: number;
  formant_f1: number;
  formant_f2: number;
  formant_f3: number;
}

interface VoiceAnalysisResponse {
  message: string;
  filename: string;
  content_type: string;
  analysis: VoiceMetricsAnalysis;
}

interface AnalyzeMoodResult {
  transcription?: string;
  voiceMetrics?: VoiceMetricsAnalysis;
  aiAnalysis?: MoodAnalysisResponse;
  rawResponse?: OpenAI.Chat.Completions.ChatCompletionMessage;
  message?: string;
}

interface AnalyzeTextResult {
  aiAnalysis?: MoodAnalysisResponse;
  rawResponse?: OpenAI.Chat.Completions.ChatCompletionMessage | null;
  createdRecord?: any;
  message?: string;
}

@Injectable()
export class MoodRecordService {
  private readonly client: OpenAI;
  private readonly context: ChatMessage;

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {
    // Inicializar OpenAI no construtor
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY as string,
    });

    this.context = {
      role: 'system',
      content: `Você é assistente da plataforma Mentis de bem-estar emocional.

Analise o estado emocional do usuário e retorne APENAS JSON válido neste formato exato:
{
  "score_mood": 1-5,
  "score_anxiety": 1-5,
  "score_energy": 1-5,
  "score_sleep": 1-5,
  "score_stress": 1-5,
  "notes": "transcrição exata do usuário",
  "ai_insight": "análise empática breve"
}

Regras:
- Use EXATAMENTE o que foi dito em "notes"
- Seja empático e preciso no "ai_insight"
- Retorne APENAS JSON, sem texto extra`,
    };
  }

  private async convertToWav(inputBuffer: Buffer): Promise<Buffer> {
    const tempName = `temp_${Date.now()}`;
    const inputPath = join(__dirname, `${tempName}.webm`);
    const outputPath = join(__dirname, `${tempName}.wav`);

    await fs.writeFile(inputPath, inputBuffer);

    return new Promise<Buffer>((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('wav')
        .on('error', reject)
        .on('end', () => {
          fs.readFile(outputPath)
            .then(async (outputBuffer) => {
              await fs.unlink(inputPath);
              await fs.unlink(outputPath);
              resolve(outputBuffer);
            })
            .catch(reject);
        })
        .save(outputPath);
    });
  }

  async fetchTestData(): Promise<FetchedData> {
    const response = await firstValueFrom(
      this.httpService.get<FetchedData>('http://localhost:7001/voice'),
    );
    return response.data;
  }

  async analyzeMood(
    file: Express.Multer.File,
    userId?: string,
  ): Promise<AnalyzeMoodResult> {
    try {
      if (!userId) {
        throw new Error('User ID is required for mood analysis');
      }

      if (!file) {
        throw new Error('Audio file is required for mood analysis');
      }

      // 🔹 Normaliza data para início do dia
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 🔹 Verifica se já existe registro hoje
      const existingRecord = await this.prisma.moodRecord.findUnique({
        where: {
          userId_date: { userId, date: today },
        },
      });

      if (existingRecord) {
        console.log(
          '⚠️ User already has a mood record for today. Skipping AI call.',
        );

        // Parse ai_features do banco (Prisma.JsonValue) para VoiceMetricsAnalysis
        return {
          message: 'User already has a mood record for today.',
        };
      }

      // 1. Converte para WAV
      const wavBuffer = await this.convertToWav(file.buffer);
      console.log('✅ Audio converted to WAV format.');
      console.log(wavBuffer);
      // 2. Transcrever o áudio com Whisper
      const transcription = await this.transcribeAudioWithWhisper(wavBuffer);
      // const transcription = 'Transcrição do áudio teste';

      // 3. Enviar para análise de métricas vocais (Python)
      const formData = new FormData();
      formData.append('file', wavBuffer, {
        filename: 'audio.wav',
        contentType: 'audio/wav',
      });

      const voiceAnalysis = await firstValueFrom(
        this.httpService.post<VoiceAnalysisResponse>(
          'https://voice.mentis.ia.br/voice/analyze',
          formData,
          {
            headers: formData.getHeaders(),
          },
        ),
      );

      // 4. Combinar transcrição + métricas e enviar para OpenAI
      const metrics = voiceAnalysis.data.analysis;
      const messages: ChatMessage[] = [
        this.context,
        {
          role: 'user',
          content: `Transcrição: "${transcription}"

          Métricas vocais:
          - Pitch médio: ${metrics.pitch_mean.toFixed(1)}Hz (ansiedade se >250)
          - Jitter: ${metrics.jitter_local.toFixed(3)} (tensão se >0.01)
          - Energia vocal: ${metrics.rms.toFixed(3)}
          - Taxa de cruzamento zero: ${metrics.zcr.toFixed(4)}`,
        },
      ];

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 300, // Reduzido para economizar tokens
        temperature: 0.5, // Mais consistente
        response_format: { type: 'json_object' },
      });

      // 5. Parse da resposta JSON
      let aiResponse: MoodAnalysisResponse;
      try {
        aiResponse = JSON.parse(
          completion.choices[0].message?.content || '{}',
        ) as MoodAnalysisResponse;
      } catch (error) {
        console.error('❌ Error parsing AI response:', error);
        aiResponse = {
          score_mood: 3,
          score_anxiety: 3,
          score_energy: 3,
          score_sleep: 3,
          score_stress: 3,
          ai_insight: 'Não foi possível analisar o humor no momento.',
          transcripted_audio: transcription,
        };
      }

      // 6. Salvar no banco de dados com Prisma
      const date = new Date();
      date.setHours(0, 0, 0, 0);

      await this.prisma.moodRecord.create({
        data: {
          userId: userId,
          score_mood: aiResponse.score_mood,
          score_anxiety: aiResponse.score_anxiety,
          score_energy: aiResponse.score_energy,
          score_sleep: aiResponse.score_sleep,
          score_stress: aiResponse.score_stress,
          transcripted_audio: transcription,
          date: date,
          ai_insight: aiResponse.ai_insight,
          ai_features: voiceAnalysis.data.analysis,
        },
      });

      return {
        transcription,
        voiceMetrics: voiceAnalysis.data.analysis,
        aiAnalysis: aiResponse,
        rawResponse: completion.choices[0].message,
      };
    } catch (error) {
      console.error('❌ Error analyzing mood:', error);
      throw new Error('Erro ao analisar o humor');
    }
  }

  // private async transcribeAudioWithWhisper(
  //   audioBuffer: Buffer,
  // ): Promise<string> {
  //   try {
  //     // Usar toFile do OpenAI SDK (funciona melhor com Buffer)
  //     const { toFile } = await import('openai');
  //     const file = await toFile(audioBuffer, 'audio.wav', {
  //       type: 'audio/wav',
  //     });

  //     const transcription = await this.client.audio.transcriptions.create({
  //       file: file,
  //       model: 'whisper-1',
  //       language: 'pt', // Português
  //       response_format: 'text',
  //     });

  //     return String(transcription);
  //   } catch (error) {
  //     console.error('❌ Error transcribing audio:', error);
  //     throw new Error('Erro ao transcrever áudio com Whisper');
  //   }
  // }

  private async transcribeAudioWithWhisper(
    audioBuffer: Buffer,
  ): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename: 'audio.wav',
        contentType: 'audio/wav',
      });

      const response = await firstValueFrom(
        this.httpService.post<{ text: string }>(
          'https://voice.mentis.ia.br/voice/transcribe',
          formData,
          {
            headers: formData.getHeaders(),
          },
        ),
      );

      if (!response.data.text) {
        throw new Error('Empty transcription result');
      }

      return response.data.text;
    } catch (error) {
      console.error('❌ Error transcribing audio locally:', error);
      throw new Error('Erro ao transcrever áudio com Whisper local');
    }
  }

  async AnalyseMoodText(
    data: CreateMoodDto,
    userId?: string,
  ): Promise<AnalyzeTextResult> {
    console.log('🤖 Sending text data to OpenAI for mood analysis...');
    console.log('User ID for analysis:', userId);
    try {
      if (!userId) {
        throw new Error('User ID is required for mood text analysis');
      }

      // 🔹 Normaliza data para início do dia
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 🔹 Verifica se já existe registro hoje
      const existingRecord = await this.prisma.moodRecord.findUnique({
        where: {
          userId_date: { userId, date: today },
        },
      });

      if (existingRecord) {
        console.log(
          '⚠️ User already has a mood record for today. Skipping AI call.',
        );
        return {
          message: 'User already has a mood record for today.',
        };
      }

      // Context simplificado só para análise de insight
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `Você é assistente da plataforma Mentis. Analise o texto do usuário e retorne APENAS JSON neste formato:
{
  "ai_insight": "análise empática e breve do estado emocional"
}`,
        },
        {
          role: 'user',
          content: data.notes || '',
        },
      ];

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 150, // Ainda mais reduzido pois só retorna insight
        temperature: 0.5,
        response_format: { type: 'json_object' },
      });

      console.log(
        '✅ OpenAI response:',
        completion.choices[0].message?.content,
      );

      // Parse da resposta JSON (só precisa do ai_insight)
      let aiInsight: string;
      try {
        const parsed = JSON.parse(
          completion.choices[0].message?.content || '{}',
        ) as { ai_insight: string };
        aiInsight = parsed.ai_insight || 'Análise não disponível.';
      } catch (error) {
        console.error('❌ Error parsing AI response:', error);
        aiInsight = 'Não foi possível gerar uma análise no momento.';
      }
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      // Salvar no banco de dados com Prisma (scores vêm do frontend)
      const createdRecord = await this.prisma.moodRecord.create({
        data: {
          userId: userId,
          score_mood: data.score_mood,
          score_anxiety: data.score_anxiety,
          score_energy: data.score_energy,
          score_sleep: data.score_sleep,
          score_stress: data.score_stress,
          notes: data.notes,
          date: date,
          ai_insight: aiInsight, // Apenas o insight gerado pela IA
        },
      });

      return {
        aiAnalysis: {
          score_mood: data.score_mood,
          score_anxiety: data.score_anxiety,
          score_energy: data.score_energy,
          score_sleep: data.score_sleep,
          score_stress: data.score_stress,
          notes: data.notes,
          ai_insight: aiInsight,
        },
        rawResponse: completion.choices[0].message,
        createdRecord,
      };
    } catch (error) {
      console.error('❌ Error during mood text analysis:', error);
      throw new Error('Erro ao analisar o humor do texto com OpenAI');
    }
  }
}
