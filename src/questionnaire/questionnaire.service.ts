import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateBlockResponseDto } from './dto/create-response.dto';
import { EmailService } from 'src/email/email.service';
import { OciService } from 'src/oci-storage/oci-storage.service';

@Injectable()
export class QuestionnaireService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly ociService: OciService,
  ) {}

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

    try {
      // Salva as respostas
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      console.log('User found:', user);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      for (const response of responses) {
        await this.prisma.userAnswer.create({
          data: {
            userId,
            questionId: response.questionId,
            answer: { value: response.value },
          },
        });
      }

      // const block = await this.prisma.block.findUnique({
      //   where: { id: blockId },
      //   include: {
      //     questionnaire: {
      //       select: { id: true, title: true },
      //     },
      //   },
      // });

      // const downloadLink = await this.ociService.getFileByFileName(
      //   `questionnaires/${block?.questionnaire.id}/${blockId}`,
      // );

      // await this.emailService.sendEmail({
      //   to: user.email,
      //   subject: 'Bonificação por completar o questionário',
      //   context: {
      //     userName: user.name,
      //     questionnaireTitle: block?.questionnaire.title,
      //     downloadLink,
      //   },
      //   template: 'bonification',
      // });

      return {
        message: 'Respostas salvas com sucesso',
        responsesSaved: responses.length,
      };
    } catch (error) {
      // Log do erro para depuração
      console.error('Erro ao salvar respostas:', error);
      throw new NotFoundException('Erro ao salvar respostas');
    }
  }

  async getUserResponses(userId: string, blockId: string) {
    const blockTitle = await this.prisma.block.findUnique({
      where: { id: blockId },
      select: { title: true },
    });

    const userAnswers = await this.prisma.userAnswer.findMany({
      where: { userId, question: { blockId } },
      include: {
        question: {
          select: {
            id: true,
            question: true,
            blockId: true,
          },
        },
      },
    });

    return { blockTitle: blockTitle?.title, userAnswers };
  }

  // Verifica se o usuário tem acesso ao bloco e se já respondeu
  async checkBlockAccess(blockId: string, userId: string) {
    // Verifica se o bloco existe
    const block = await this.prisma.block.findUnique({
      where: { id: blockId },
      select: {
        id: true,
        title: true,
        questionnaire: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    // Conta o total de questões no bloco
    const totalQuestions = await this.prisma.question.count({
      where: { blockId: blockId },
    });

    // Conta quantas questões o usuário já respondeu neste bloco
    const answeredQuestions = await this.prisma.userAnswer.count({
      where: {
        userId: userId,
        question: {
          blockId: blockId,
        },
      },
    });

    // Usuário já respondeu se o número de respostas é igual ao total de questões
    const hasAnswered =
      answeredQuestions === totalQuestions && totalQuestions > 0;

    // Pode responder se tem acesso e ainda não respondeu
    const canAnswer = !hasAnswered;

    return {
      canAccess: canAnswer,
      blockTitle: block.title,
    };
  }
  async getBonusLink(blockId: string) {
    // Verifica se o bloco existe
    try {
      const block = await this.prisma.block.findUnique({
        where: { id: blockId },
      });

      if (!block) {
        throw new NotFoundException('Block not found');
      }

      return {
        link: block.bonus,
        status: 'success',
        statusCode: 200,
      };
    } catch (error) {
      console.error('Error fetching block:', error);
      throw new NotFoundException('Block not found');
    }
  }
}
