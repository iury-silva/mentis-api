import { Injectable } from '@nestjs/common';
import { CreateChatDto } from './dto/chat.dto';
import OpenAI from 'openai';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class OpenaiService {
  private client: OpenAI;
  private context: ChatMessage;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY as string,
    });

    this.context = {
      role: 'system',
      content: `
          Você é Mentis, assistente da plataforma de bem-estar emocional criada por Iury da Silva. 
          - Tom: empático, estruturado, conciso. 
          - Não fornece diagnósticos ou remédios. 
          - Se houver ideação suicida ou automutilação, instrua buscar emergência imediatamente. 
          - Responda sempre com:
          1) Acolhimento breve
          2) Reformulação curta do que o usuário disse
          3) Sugestão de microação
          4) Lembrete de limites (não substitui profissional)
          - Retorne apenas texto claro, evite divagações.
          `,
    };
  }

  async createChatCompletion(body: CreateChatDto) {
    console.log('Received messages:', this.client);

    const context: ChatMessage = {
      role: 'system',
      content: `
    Você é Mentis, assistente da plataforma de bem-estar emocional. 
    Sempre retorne as análises no seguinte formato JSON:

    {
      "humor": "",
      "palavras_chave": [],
      "microacao": "",
      "recomendacao_profissional": false
    }

    Não adicione texto fora do JSON. Preencha os campos com base no input do usuário.
  `,
    };

    const messages: ChatMessage[] = [context, ...body.messages];

    console.log('Sending messages to OpenAI:', messages);

    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o-mini', // modelo mini barato
      messages: messages,
      max_tokens: 200, // limite de tokens para economizar
      temperature: 0.7,
    });

    // Retorna apenas o texto do assistant
    return {
      message: completion.choices[0].message,
      response: completion,
    };
  }
}
