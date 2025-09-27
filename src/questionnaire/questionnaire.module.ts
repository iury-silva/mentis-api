import { Module } from '@nestjs/common';
import { QuestionnaireService } from './questionnaire.service';
import { QuestionnaireController } from './questionnaire.controller';
import { PrismaService } from 'src/database/prisma.service';
import { EmailService } from 'src/email/email.service';
import { OciService } from 'src/oci-storage/oci-storage.service';

@Module({
  controllers: [QuestionnaireController],
  providers: [QuestionnaireService, PrismaService, EmailService, OciService],
})
export class QuestionnaireModule {}
