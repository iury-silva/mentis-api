import { Module } from '@nestjs/common';
import { QuestionnaireService } from './questionnaire.service';
import { QuestionnaireController } from './questionnaire.controller';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  controllers: [QuestionnaireController],
  providers: [QuestionnaireService, PrismaService],
})
export class QuestionnaireModule {}
