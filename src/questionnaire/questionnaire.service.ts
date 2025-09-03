/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
import { UpdateQuestionnaireDto } from './dto/update-questionnaire.dto';
import { PrismaService } from 'src/database/prisma.service';
import questionnaires from './questionnaire.json';
import { Question } from '@prisma/client';

@Injectable()
export class QuestionnaireService {
  constructor(private readonly prisma: PrismaService) {}
  private questionnaires = questionnaires;

  create(createQuestionnaireDto: CreateQuestionnaireDto) {
    return 'This action adds a new questionnaire';
  }

  async findAll(): Promise<Record<string, Question[]>> {
    const questions: Question[] = await this.prisma.question.findMany({
      orderBy: { question: 'asc' },
    });

    const groupedQuestions: Record<string, Question[]> = questions.reduce(
      (acc: Record<string, Question[]>, question: Question) => {
        const blockId: string = question.blockId;
        if (!acc[blockId]) acc[blockId] = [];
        acc[blockId].push(question);
        return acc;
      },
      {},
    );

    return groupedQuestions;
  }

  findOne(id: number) {
    return `This action returns a #${id} questionnaire`;
  }

  update(id: number, updateQuestionnaireDto: UpdateQuestionnaireDto) {
    return `This action updates a #${id} questionnaire`;
  }

  remove(id: number) {
    return `This action removes a #${id} questionnaire`;
  }
}
