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
import puppeteer from 'puppeteer';
import type { Response } from 'express';

ffmpeg.setFfmpegPath(ffmpegPath as string);

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

interface ReportUser {
  name: string;
  email: string;
}

interface ReportRecord {
  date: Date;
  score_mood: number;
  score_anxiety: number;
  score_energy: number;
  score_sleep: number;
  score_stress: number;
  ai_insight?: string | null;
}

interface ReportStats {
  totalRecords: number;
  averages?: {
    score_mood: number;
    score_anxiety: number;
    score_energy: number;
    score_sleep: number;
    score_stress: number;
  } | null;
  trends?: {
    score_mood: number;
    score_anxiety: number;
    score_energy: number;
    score_sleep: number;
    score_stress: number;
  } | null;
  streaks?: number;
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
        "ai_insight": "análise empática e conselhos úteis sobre o estado emocional e como lidar com ele e melhorar o bem-estar"
      }

      Regras:
      - Use EXATAMENTE o que foi dito em "notes"
      - Seja empático e preciso no "ai_insight"
      - Retorne APENAS JSON, sem texto extra`,
    };
  }

  /*
   * ----------ENDPOINTS DE ANALISE DE HUMOR----------
   * 1. POST /mood/analyze-voice - Analisa humor via áudio
   * 2. POST /mood/analyze-text - Analisa humor via texto
   * -------------------------------------------------
   *  $$ INICIO $$
   */

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
            "ai_insight": "análise empática e dicas úteis sobre o estado emocional como lidar com ele e melhorar o bem-estar"
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
        max_tokens: 300,
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

  /*
   *  $$ FIM $$
   */

  /*
   *  ---------- ENDPOINTS DE PESQUISA DE HUMOR COM PAGINAÇÃO ----------
   * 1. GET /mood/history?page=&limit= - Retorna histórico paginado
   * 2. GET /mood/has-today - Verifica se há registro para hoje
   * 3. DELETE /mood/:id - Deleta um registro específico
   * -------------------------------------------------
   *  $$ INICIO $$
   */
  async getMoodHistory(userId?: string, page: number = 1, limit: number = 10) {
    if (!userId) {
      throw new Error('User ID is required to fetch mood history');
    }
    try {
      const skip = (page - 1) * limit;

      const [records, totalRecords] = await this.prisma.$transaction([
        this.prisma.moodRecord.findMany({
          where: { userId },
          orderBy: { date: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.moodRecord.count({
          where: { userId },
        }),
      ]);

      const totalPages = Math.ceil(totalRecords / limit);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const sanitizedRecords = records.map(({ ai_features, ...record }) => ({
        ...record,
        // 🎯 Bem-estar geral: inverte ansiedade e estresse (quanto menor, melhor)
        average_mood_score: Number(
          (
            (record.score_mood +
              (6 - record.score_anxiety) + // Inverte: 5→1, 4→2, 3→3, 2→4, 1→5
              record.score_energy +
              record.score_sleep +
              (6 - record.score_stress)) / // Inverte: 5→1, 4→2, 3→3, 2→4, 1→5
            5
          ).toFixed(1),
        ),
      }));

      return {
        records: sanitizedRecords,
        pagination: {
          totalRecords,
          totalPages,
          currentPage: page,
          pageSize: limit,
        },
      };
    } catch (error) {
      console.error('❌ Error fetching mood history:', error);
      throw new Error('Erro ao buscar histórico de humor');
    }
  }

  /*
   *  ------- Verificar registro de hoje ----------
   */
  async hasMoodRecordToday(
    userId?: string,
  ): Promise<{ hasRecordToday: boolean }> {
    if (!userId) {
      throw new Error('User ID is required to check today mood record');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const record = await this.prisma.moodRecord.findUnique({
        where: {
          userId_date: { userId, date: today },
        },
      });

      return {
        hasRecordToday: record ? true : false,
      };
    } catch (error) {
      console.error('❌ Error checking mood record for today:', error);
      throw new Error('Erro ao verificar registro de humor para hoje');
    }
  }

  async deleteMoodRecord(
    recordId: string,
    userId?: string,
  ): Promise<{ message: string }> {
    if (!userId) {
      throw new Error('User ID is required to delete mood record');
    }
    console.log(recordId, userId);
    try {
      const record = await this.prisma.moodRecord.findUnique({
        where: {
          id: recordId,
          userId,
        },
      });

      if (!record || record.userId !== userId) {
        throw new Error('Mood record not found or access denied');
      }

      await this.prisma.moodRecord.delete({
        where: {
          id: recordId,
          userId,
        },
      });
      return { message: 'Registro de humor deletado com sucesso' };
    } catch (error) {
      console.error('❌ Error deleting mood record:', error);
      throw new Error('Erro ao deletar o registro de humor');
    }
  }

  async getStatsOverview(userId?: string) {
    if (!userId) {
      throw new Error('User ID is required to fetch stats overview');
    }

    try {
      const records = await this.prisma.moodRecord.findMany({
        where: { userId },
        select: {
          score_mood: true,
          score_anxiety: true,
          score_energy: true,
          score_sleep: true,
          score_stress: true,
          date: true,
        },
      });

      if (records.length === 0) {
        return {
          totalRecords: 0,
          averages: null,
          trends: null,
          lastRecord: null,
        };
      }

      // Cálculo das médias
      const totalRecords = records.length;
      const sumScores = records.reduce(
        (acc, record) => {
          acc.score_mood += record.score_mood;
          acc.score_anxiety += record.score_anxiety;
          acc.score_energy += record.score_energy;
          acc.score_sleep += record.score_sleep;
          acc.score_stress += record.score_stress;
          return acc;
        },
        {
          score_mood: 0,
          score_anxiety: 0,
          score_energy: 0,
          score_sleep: 0,
          score_stress: 0,
        },
      );

      const averages = {
        score_mood: parseFloat(
          (sumScores.score_mood / totalRecords).toFixed(2),
        ),
        score_anxiety: parseFloat(
          (sumScores.score_anxiety / totalRecords).toFixed(2),
        ),
        score_energy: parseFloat(
          (sumScores.score_energy / totalRecords).toFixed(2),
        ),
        score_sleep: parseFloat(
          (sumScores.score_sleep / totalRecords).toFixed(2),
        ),
        score_stress: parseFloat(
          (sumScores.score_stress / totalRecords).toFixed(2),
        ),
      };

      // Tendências simples (diferença entre o primeiro e o último registro)
      const sortedRecords = records.sort(
        (a, b) => a.date.getTime() - b.date.getTime(),
      );
      const firstRecord = sortedRecords[0];
      const lastRecord = sortedRecords[sortedRecords.length - 1];

      const trends = {
        score_mood: parseFloat(
          (lastRecord.score_mood - firstRecord.score_mood).toFixed(2),
        ),
        score_anxiety: parseFloat(
          (lastRecord.score_anxiety - firstRecord.score_anxiety).toFixed(2),
        ),
        score_energy: parseFloat(
          (lastRecord.score_energy - firstRecord.score_energy).toFixed(2),
        ),
        score_sleep: parseFloat(
          (lastRecord.score_sleep - firstRecord.score_sleep).toFixed(2),
        ),
        score_stress: parseFloat(
          (lastRecord.score_stress - firstRecord.score_stress).toFixed(2),
        ),
      };

      const streaks = this.calculateStreak(records);
      return {
        totalRecords,
        averages,
        trends,
        lastRecord,
        streaks,
      };
    } catch (error) {
      console.error('❌ Error fetching stats overview:', error);
      throw new Error('Erro ao buscar visão geral das estatísticas');
    }
  }

  // Função auxiliar para calcular sequência de dias
  private calculateStreak(records: Array<{ date: Date | string }>): number {
    if (records.length === 0) return 0;

    const sortedDates = records
      .map((r) => new Date(r.date))
      .sort((a, b) => b.getTime() - a.getTime());

    let streak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Se não registrou hoje, não tem streak
    if (sortedDates[0].getTime() !== today.getTime()) {
      return 0;
    }

    for (let i = 1; i < sortedDates.length; i++) {
      const diff = Math.floor(
        (sortedDates[i - 1].getTime() - sortedDates[i].getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  // 📊 8. Comparação de períodos
  async comparePeriods(period: 'week' | 'month' | 'year', userId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentStart: Date,
      currentEnd: Date,
      previousStart: Date,
      previousEnd: Date;

    switch (period) {
      case 'week':
        currentStart = new Date(today);
        currentStart.setDate(currentStart.getDate() - 6);
        currentEnd = today;

        previousStart = new Date(currentStart);
        previousStart.setDate(previousStart.getDate() - 7);
        previousEnd = new Date(currentStart);
        previousEnd.setDate(previousEnd.getDate() - 1);
        break;

      case 'month':
        currentStart = new Date(today.getFullYear(), today.getMonth(), 1);
        currentEnd = today;

        previousStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        previousEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        break;

      case 'year':
        currentStart = new Date(today.getFullYear(), 0, 1);
        currentEnd = today;

        previousStart = new Date(today.getFullYear() - 1, 0, 1);
        previousEnd = new Date(today.getFullYear() - 1, 11, 31);
        break;
    }

    const [currentRecords, previousRecords] = await Promise.all([
      this.prisma.moodRecord.findMany({
        where: {
          userId,
          date: { gte: currentStart, lte: currentEnd },
        },
      }),
      this.prisma.moodRecord.findMany({
        where: {
          userId,
          date: { gte: previousStart, lte: previousEnd },
        },
      }),
    ]);

    const calculateAverages = (records: typeof currentRecords) => {
      if (records.length === 0) return null;

      return {
        mood:
          records.reduce((sum, r) => sum + r.score_mood, 0) / records.length,
        anxiety:
          records.reduce((sum, r) => sum + r.score_anxiety, 0) / records.length,
        energy:
          records.reduce((sum, r) => sum + r.score_energy, 0) / records.length,
        sleep:
          records.reduce((sum, r) => sum + r.score_sleep, 0) / records.length,
        stress:
          records.reduce((sum, r) => sum + r.score_stress, 0) / records.length,
      };
    };

    return {
      current: {
        period: `${currentStart.toLocaleDateString('pt-BR')} - ${currentEnd.toLocaleDateString('pt-BR')}`,
        recordCount: currentRecords.length,
        averages: calculateAverages(currentRecords),
      },
      previous: {
        period: `${previousStart.toLocaleDateString('pt-BR')} - ${previousEnd.toLocaleDateString('pt-BR')}`,
        recordCount: previousRecords.length,
        averages: calculateAverages(previousRecords),
      },
    };
  }

  // 📊 6. Dados por período customizado
  async getByDateRange(startDate: Date, endDate: Date, userId?: string) {
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const records = await this.prisma.moodRecord.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    return records;
  }

  // 📄 Gerar relatório PDF completo
  async generatePdfReport(userId: string, res: Response): Promise<void> {
    try {
      // 1. Buscar dados do usuário
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // 2. Buscar registros (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      const records = await this.prisma.moodRecord.findMany({
        where: {
          userId,
          date: { gte: thirtyDaysAgo },
        },
        orderBy: { date: 'desc' },
        select: {
          date: true,
          score_mood: true,
          score_anxiety: true,
          score_energy: true,
          score_sleep: true,
          score_stress: true,
          ai_insight: true,
        },
      });

      // 3. Buscar estatísticas
      const stats = await this.getStatsOverview(userId);

      // 4. Criar HTML estilizado
      const html = await this.generateReportHTML(user, records, stats);

      // 5. Gerar PDF com Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });

      await browser.close();

      // 6. Configurar resposta
      const fileName = `relatorio-mentis-${user.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`,
      );
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error) {
      console.error('❌ Error generating PDF report:', error);
      throw new Error('Erro ao gerar relatório PDF');
    }
  }

  // Método auxiliar para gerar HTML do relatório
  private async generateReportHTML(
    user: ReportUser,
    records: ReportRecord[],
    stats: ReportStats,
  ): Promise<string> {
    // 1. Carregar template
    const templatePath = join(__dirname, 'templates', 'report-template.html');
    const template = await fs.readFile(templatePath, 'utf-8');

    // 2. Funções auxiliares
    const getEmoji = (score: number): string => {
      if (score >= 4.5) return '😊';
      if (score >= 3.5) return '🙂';
      if (score >= 2.5) return '😐';
      if (score >= 1.5) return '😟';
      return '😢';
    };

    const getScoreColor = (score: number): string => {
      if (score >= 4) return '#10b981';
      if (score >= 3) return '#3b82f6';
      if (score >= 2) return '#f59e0b';
      return '#ef4444';
    };

    // 3. Preparar dados
    const currentDate = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const currentYear = new Date().getFullYear();
    const wellbeingScore = stats.averages
      ? (
          (stats.averages.score_mood +
            (6 - stats.averages.score_anxiety) +
            stats.averages.score_energy +
            stats.averages.score_sleep +
            (6 - stats.averages.score_stress)) /
          5
        ).toFixed(1)
      : 'N/A';

    // 4. Gerar cards de estatísticas
    const statsCards = stats.averages
      ? `
      <div class="stat-card">
        <span class="stat-emoji">${getEmoji(stats.averages.score_mood)}</span>
        <div class="stat-label">Humor Médio</div>
        <div class="stat-value" style="color: ${getScoreColor(stats.averages.score_mood)}">
          ${stats.averages.score_mood.toFixed(1)}/5
        </div>
      </div>

      <div class="stat-card">
        <span class="stat-emoji">😰</span>
        <div class="stat-label">Ansiedade Média</div>
        <div class="stat-value" style="color: ${getScoreColor(6 - stats.averages.score_anxiety)}">
          ${stats.averages.score_anxiety.toFixed(1)}/5
        </div>
      </div>

      <div class="stat-card">
        <span class="stat-emoji">⚡</span>
        <div class="stat-label">Energia Média</div>
        <div class="stat-value" style="color: ${getScoreColor(stats.averages.score_energy)}">
          ${stats.averages.score_energy.toFixed(1)}/5
        </div>
      </div>

      <div class="stat-card">
        <span class="stat-emoji">💤</span>
        <div class="stat-label">Qualidade do Sono</div>
        <div class="stat-value" style="color: ${getScoreColor(stats.averages.score_sleep)}">
          ${stats.averages.score_sleep.toFixed(1)}/5
        </div>
      </div>

      <div class="stat-card">
        <span class="stat-emoji">😓</span>
        <div class="stat-label">Nível de Estresse</div>
        <div class="stat-value" style="color: ${getScoreColor(6 - stats.averages.score_stress)}">
          ${stats.averages.score_stress.toFixed(1)}/5
        </div>
      </div>

      <div class="stat-card">
        <span class="stat-emoji">🎯</span>
        <div class="stat-label">Bem-Estar Geral</div>
        <div class="stat-value" style="color: ${getScoreColor(Number(wellbeingScore))}">
          ${wellbeingScore}/5
        </div>
      </div>
    `
      : '<p>Estatísticas não disponíveis</p>';

    // 5. Gerar seção de tendências
    const trendsSection = stats.trends
      ? `
      <div class="section">
        <h2 class="section-title">📈 Tendências Recentes</h2>
        <div class="highlight-box">
          <h3>Evolução do seu bem-estar</h3>
          <p>
            <strong>Humor:</strong> 
            <span class="trend-indicator ${stats.trends.score_mood > 0 ? 'trend-up' : stats.trends.score_mood < 0 ? 'trend-down' : 'trend-neutral'}">
              ${stats.trends.score_mood > 0 ? '↑' : stats.trends.score_mood < 0 ? '↓' : '→'} 
              ${stats.trends.score_mood > 0 ? '+' : ''}${stats.trends.score_mood.toFixed(1)}
            </span>
            &nbsp;&nbsp;
            <strong>Ansiedade:</strong> 
            <span class="trend-indicator ${stats.trends.score_anxiety < 0 ? 'trend-up' : stats.trends.score_anxiety > 0 ? 'trend-down' : 'trend-neutral'}">
              ${stats.trends.score_anxiety > 0 ? '↑' : stats.trends.score_anxiety < 0 ? '↓' : '→'} 
              ${stats.trends.score_anxiety > 0 ? '+' : ''}${stats.trends.score_anxiety.toFixed(1)}
            </span>
            &nbsp;&nbsp;
            <strong>Estresse:</strong> 
            <span class="trend-indicator ${stats.trends.score_stress < 0 ? 'trend-up' : stats.trends.score_stress > 0 ? 'trend-down' : 'trend-neutral'}">
              ${stats.trends.score_stress > 0 ? '↑' : stats.trends.score_stress < 0 ? '↓' : '→'} 
              ${stats.trends.score_stress > 0 ? '+' : ''}${stats.trends.score_stress.toFixed(1)}
            </span>
          </p>
        </div>
      </div>
    `
      : '';

    // 6. Gerar linhas de registros
    const recordsRows = records
      .slice(0, 10)
      .map(
        (record) => `
      <tr>
        <td><strong>${new Date(record.date).toLocaleDateString('pt-BR')}</strong></td>
        <td><span class="score-badge" style="background: ${getScoreColor(record.score_mood)}">${record.score_mood}/5</span></td>
        <td><span class="score-badge" style="background: ${getScoreColor(6 - record.score_anxiety)}">${record.score_anxiety}/5</span></td>
        <td><span class="score-badge" style="background: ${getScoreColor(record.score_energy)}">${record.score_energy}/5</span></td>
        <td><span class="score-badge" style="background: ${getScoreColor(record.score_sleep)}">${record.score_sleep}/5</span></td>
        <td><span class="score-badge" style="background: ${getScoreColor(6 - record.score_stress)}">${record.score_stress}/5</span></td>
      </tr>
      ${
        record.ai_insight
          ? `
      <tr>
        <td colspan="6">
          <div class="insight-box">
            <strong>💡 Insight da IA:</strong> ${record.ai_insight}
          </div>
        </td>
      </tr>
      `
          : ''
      }
    `,
      )
      .join('');

    // 7. Substituir variáveis no template
    const html = template
      .replace(/{{userName}}/g, user.name)
      .replace(/{{userEmail}}/g, user.email)
      .replace(/{{currentDate}}/g, currentDate)
      .replace(/{{currentYear}}/g, currentYear.toString())
      .replace(/{{totalRecords}}/g, stats.totalRecords.toString())
      .replace(/{{streakDays}}/g, (stats.streaks || 0).toString())
      .replace(/{{statsCards}}/g, statsCards)
      .replace(/{{trendsSection}}/g, trendsSection)
      .replace(/{{recordsRows}}/g, recordsRows);

    return html;
  }
}
