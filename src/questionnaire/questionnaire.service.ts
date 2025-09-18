import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateBlockResponseDto } from './dto/create-response.dto';

@Injectable()
export class QuestionnaireService {
  constructor(private readonly prisma: PrismaService) {}

  // retorna todos os questionários com blocos e isCompleted (sem perguntas)
  async findAll(userId?: string) {
    const questionnaires = await this.prisma.questionnaire.findMany({
      include: {
        blocks: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            order: true,
          },
        },
      },
    });

    if (userId) {
      // Se userId for fornecido, calcula isCompleted para cada bloco
      const questionnairesWithStatus = await Promise.all(
        questionnaires.map(async (questionnaire) => {
          const blocks = await this.getBlocksWithCompletionStatus(
            questionnaire.blocks,
            userId,
          );
          return { ...questionnaire, blocks };
        }),
      );
      return questionnairesWithStatus;
    }

    return questionnaires;
  }

  // calcula isCompleted para cada bloco sem trazer perguntas
  private async getBlocksWithCompletionStatus(
    blocks: { id: string }[],
    userId: string,
  ) {
    const blocksWithStatus = await Promise.all(
      blocks.map(async (block) => {
        // conta todas as perguntas do bloco
        const totalQuestions = await this.prisma.question.count({
          where: { blockId: block.id },
        });

        // conta quantas respostas o usuário já deu nesse bloco
        const answeredQuestions = await this.prisma.userAnswer.count({
          where: { question: { blockId: block.id }, userId },
        });

        return {
          ...block,
          isCompleted:
            totalQuestions > 0 && answeredQuestions === totalQuestions,
        };
      }),
    );

    return blocksWithStatus;
  }

  // endpoint para lazy loading: retorna as perguntas de um bloco
  async getQuestionsByBlock(blockId: string) {
    const questions = await this.prisma.question.findMany({
      where: { blockId },
    });
    return questions;
  }

  // retorna um único questionário (com blocos e perguntas)
  async findOne(id: string) {
    return await this.prisma.questionnaire.findUnique({
      where: { id },
      include: {
        blocks: {
          orderBy: { order: 'asc' },
          include: {
            questions: {
              orderBy: { question: 'asc' },
            },
          },
        },
      },
    });
  }

  async create(data: { title: string; description?: string }) {
    return await this.prisma.questionnaire.create({ data });
  }

  async remove(id: string) {
    return await this.prisma.questionnaire.delete({ where: { id } });
  }

  async update(id: string, data: { title?: string; description?: string }) {
    return await this.prisma.questionnaire.update({
      where: { id },
      data,
    });
  }

  async saveBlockResponses(responseDto: CreateBlockResponseDto) {
    const { userId, responses } = responseDto;

    // Salva as respostas
    const savedResponses = await Promise.all(
      responses.map(async (response) => {
        // Cria nova resposta
        return await this.prisma.userAnswer.create({
          data: {
            userId,
            questionId: response.questionId,
            answer: { selectedOptionId: response.selectedOptionId },
          },
        });
      }),
    );

    return {
      message: 'Respostas salvas com sucesso',
      savedResponses: savedResponses.length,
    };
  }
}
