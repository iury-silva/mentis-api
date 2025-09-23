/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const [
      totalUsers,
      totalQuestionnaires,
      totalBlocks,
      userEngagement,
      usersByRole,
      registrationsByMonth,
      blockCompletionStats,
      responsesByBlock,
      responsesByMonth,
      questionTypeDistribution,
      topActiveUsers,
    ] = await Promise.all([
      this.getTotalUsers(),
      this.getTotalQuestionnaires(),
      this.getTotalBlocks(),
      this.getUserEngagement(),
      this.getUsersByRole(),
      this.getRegistrationsByMonth(),
      this.getBlockCompletionStats(),
      this.getResponsesByBlock(),
      this.getResponsesByMonth(),
      this.getQuestionTypeDistribution(),
      this.getTopActiveUsers(),
    ]);

    return {
      summary: {
        totalUsers,
        totalQuestionnaires,
        totalBlocks,
        usersAnswered: userEngagement.usersAnswered,
        usersNotAnswered: userEngagement.usersNotAnswered,
        completionRate:
          totalUsers > 0
            ? (userEngagement.usersAnswered / totalUsers) * 100
            : 0,
        averageResponsesPerUser:
          totalUsers > 0 ? userEngagement.totalResponses / totalUsers : 0,
        totalResponses: userEngagement.totalResponses,
      },
      charts: {
        userDistribution: [
          {
            name: 'Responderam',
            value: userEngagement.usersAnswered,
            fill: '#8884d8',
          },
          {
            name: 'Não responderam',
            value: userEngagement.usersNotAnswered,
            fill: '#82ca9d',
          },
        ],
        usersByRole,
        registrationsByMonth,
        blockCompletionStats,
        responsesByBlock,
        responsesByMonth,
        questionTypeDistribution,
        topActiveUsers,
      },
      trends: {
        dailyActivity: await this.getDailyActivity(),
        weeklyGrowth: await this.getWeeklyGrowth(),
      },
    };
  }

  private async getTotalUsers(): Promise<number> {
    return await this.prisma.user.count();
  }

  private async getTotalQuestionnaires(): Promise<number> {
    return await this.prisma.questionnaire.count();
  }

  private async getTotalBlocks(): Promise<number> {
    return await this.prisma.block.count();
  }

  private async getUserEngagement() {
    const [totalUsers, usersAnswered, totalResponses] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { answers: { some: {} } },
      }),
      this.prisma.userAnswer.count(),
    ]);

    return {
      totalUsers,
      usersAnswered,
      usersNotAnswered: totalUsers - usersAnswered,
      totalResponses,
    };
  }

  private async getUsersByRole() {
    const users = await this.prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
    });

    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

    return users.map((item, index) => ({
      name:
        item.role === 'user'
          ? 'Usuário'
          : item.role === 'admin'
            ? 'Admin'
            : item.role,
      value: item._count.role,
      fill: colors[index % colors.length],
    }));
  }

  private async getRegistrationsByMonth() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const registrations = await this.prisma.user.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Agrupa por mês
    const monthlyData = new Map<string, number>();

    // Inicializa os últimos 6 meses com 0
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().substring(0, 7);
      monthlyData.set(monthKey, 0);
    }

    registrations.forEach((user) => {
      const month = user.createdAt.toISOString().substring(0, 7);
      monthlyData.set(month, (monthlyData.get(month) || 0) + 1);
    });

    return Array.from(monthlyData.entries())
      .map(([month, registrations]) => ({
        month: this.formatMonth(month),
        registrations,
        monthKey: month,
      }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }

  private async getBlockCompletionStats() {
    const blocks = await this.prisma.block.findMany({
      include: {
        questions: true,
        questionnaire: {
          select: { title: true },
        },
      },
    });

    const blockStats = await Promise.all(
      blocks.map(async (block) => {
        const totalQuestions = block.questions.length;

        // Conta quantos usuários completaram este bloco
        const usersWhoAnswered = await this.prisma.userAnswer.groupBy({
          by: ['userId'],
          where: {
            question: {
              blockId: block.id,
            },
          },
          _count: {
            userId: true,
          },
        });

        const completedUsers = usersWhoAnswered.filter(
          (user) => user._count.userId === totalQuestions,
        ).length;

        const totalUsers = await this.prisma.user.count();

        return {
          blockTitle: block.title,
          questionnaire: block.questionnaire.title,
          totalQuestions,
          completedUsers,
          totalUsers,
          completionRate:
            totalUsers > 0 ? (completedUsers / totalUsers) * 100 : 0,
          partialResponses: usersWhoAnswered.length - completedUsers,
        };
      }),
    );

    return blockStats.sort((a, b) => b.completionRate - a.completionRate);
  }

  private async getResponsesByBlock() {
    const blocks = await this.prisma.block.findMany({
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });

    return blocks
      .map((block) => {
        const totalResponses = block.questions.reduce(
          (acc, question) => acc + question.answers.length,
          0,
        );

        return {
          block: block.title,
          responses: totalResponses,
          questionsCount: block.questions.length,
          avgResponsesPerQuestion:
            block.questions.length > 0
              ? Math.round((totalResponses / block.questions.length) * 100) /
                100
              : 0,
        };
      })
      .sort((a, b) => b.responses - a.responses);
  }

  private async getResponsesByMonth() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const responses = await this.prisma.userAnswer.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        createdAt: true,
      },
    });

    const monthlyData = new Map<string, number>();

    // Inicializa os últimos 6 meses com 0
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().substring(0, 7);
      monthlyData.set(monthKey, 0);
    }

    responses.forEach((response) => {
      const month = response.createdAt.toISOString().substring(0, 7);
      monthlyData.set(month, (monthlyData.get(month) || 0) + 1);
    });

    return Array.from(monthlyData.entries())
      .map(([month, responses]) => ({
        month: this.formatMonth(month),
        responses,
        monthKey: month,
      }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }

  private async getQuestionTypeDistribution() {
    const questions = await this.prisma.question.groupBy({
      by: ['type'],
      _count: { type: true },
    });

    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

    return questions.map((item, index) => ({
      name:
        item.type === 'multiple_choice'
          ? 'Múltipla Escolha'
          : item.type === 'text'
            ? 'Texto Livre'
            : item.type,
      value: item._count.type,
      fill: colors[index % colors.length],
    }));
  }

  private async getTopActiveUsers() {
    const users = await this.prisma.user.findMany({
      include: {
        answers: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    });

    return users
      .map((user) => ({
        name: user.name,
        email: user.email,
        responses: user.answers.length,
        lastActivity:
          user.answers.length > 0
            ? user.answers.sort(
                (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
              )[0].createdAt
            : user.createdAt,
      }))
      .filter((user) => user.responses > 0)
      .sort((a, b) => b.responses - a.responses)
      .slice(0, 10);
  }

  private async getDailyActivity() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const responses = await this.prisma.userAnswer.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        createdAt: true,
      },
    });

    const dailyData = new Map<string, number>();

    // Inicializa os últimos 7 dias com 0
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayKey = date.toISOString().split('T')[0];
      dailyData.set(dayKey, 0);
    }

    responses.forEach((response) => {
      const day = response.createdAt.toISOString().split('T')[0];
      dailyData.set(day, (dailyData.get(day) || 0) + 1);
    });

    return Array.from(dailyData.entries())
      .map(([day, responses]) => ({
        day: this.formatDay(day),
        responses,
        dayKey: day,
      }))
      .sort((a, b) => a.dayKey.localeCompare(b.dayKey));
  }

  private async getWeeklyGrowth() {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [
      currentWeekUsers,
      previousWeekUsers,
      currentWeekResponses,
      previousWeekResponses,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { createdAt: { gte: oneWeekAgo } },
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: twoWeeksAgo,
            lt: oneWeekAgo,
          },
        },
      }),
      this.prisma.userAnswer.count({
        where: { createdAt: { gte: oneWeekAgo } },
      }),
      this.prisma.userAnswer.count({
        where: {
          createdAt: {
            gte: twoWeeksAgo,
            lt: oneWeekAgo,
          },
        },
      }),
    ]);

    const userGrowth =
      previousWeekUsers > 0
        ? ((currentWeekUsers - previousWeekUsers) / previousWeekUsers) * 100
        : 0;

    const responseGrowth =
      previousWeekResponses > 0
        ? ((currentWeekResponses - previousWeekResponses) /
            previousWeekResponses) *
          100
        : 0;

    return {
      userGrowth: Math.round(userGrowth * 100) / 100,
      responseGrowth: Math.round(responseGrowth * 100) / 100,
      currentWeekUsers,
      previousWeekUsers,
      currentWeekResponses,
      previousWeekResponses,
    };
  }

  // Método específico para análise de uma pergunta
  async getQuestionAnalysis(questionId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        block: {
          select: { title: true },
        },
        answers: {
          select: {
            answer: true,
            createdAt: true,
            user: {
              select: { name: true, role: true },
            },
          },
        },
      },
    });

    if (!question) {
      throw new Error('Question not found');
    }

    // Analisa as respostas baseado no tipo da pergunta
    if (question.type === 'multiple_choice') {
      const optionCounts = new Map<string, number>();

      question.answers.forEach((response) => {
        const value = (response.answer as any).value;
        optionCounts.set(value, (optionCounts.get(value) || 0) + 1);
      });

      const colors = [
        '#8884d8',
        '#82ca9d',
        '#ffc658',
        '#ff7300',
        '#00ff00',
        '#ff00ff',
      ];

      return {
        question: question.question,
        type: question.type,
        blockTitle: question.block.title,
        totalResponses: question.answers.length,
        options: Array.from(optionCounts.entries())
          .map(([option, count], index) => ({
            option,
            count,
            percentage:
              Math.round((count / question.answers.length) * 100 * 100) / 100,
            fill: colors[index % colors.length],
          }))
          .sort((a, b) => b.count - a.count),
      };
    }

    return {
      question: question.question,
      type: question.type,
      blockTitle: question.block.title,
      totalResponses: question.answers.length,
      responses: question.answers.map((r) => ({
        value: (r.answer as any).value,
        createdAt: r.createdAt,
        user: r.user.name,
        userRole: r.user.role,
      })),
    };
  }

  private formatMonth(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    const months = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ];
    return `${months[parseInt(month) - 1]}/${year.substring(2)}`;
  }

  private formatDay(dayKey: string): string {
    const date = new Date(dayKey);
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return `${days[date.getDay()]} ${date.getDate().toString().padStart(2, '0')}`;
  }

  async getUserDashboard(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        answers: {
          include: {
            question: {
              select: { question: true, blockId: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const totalQuestions = await this.prisma.question.count();
    const answeredQuestions = user.answers.length;
    const completionRate =
      totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

    // Questionarios que o usuário respondeu quantidade
    const questionnaires = await this.prisma.questionnaire.findMany({
      include: {
        blocks: {
          include: {
            questions: {
              where: {
                answers: {
                  some: { userId: user.id },
                },
              },
            },
          },
        },
      },
    });

    //quantos questionarios ele respondeu por completo ou seja todas as questoes
    const completedQuestionnaires = questionnaires.filter((q) =>
      q.blocks.every((b) => b.questions.length > 0),
    );

    return {
      totalQuestions,
      answeredQuestions,
      completionRate: Math.round(completionRate * 100) / 100,
      completedQuestionnaires: completedQuestionnaires.length,
      totalQuestionnaires: questionnaires.length,
      notAnsweredQuestionnaires:
        questionnaires.length - completedQuestionnaires.length,
    };
  }
}
