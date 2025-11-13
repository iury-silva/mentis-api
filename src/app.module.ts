import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { QuestionnaireModule } from './questionnaire/questionnaire.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { UploadModule } from './upload/upload.module';
import { ConfigModule } from '@nestjs/config';
import { OciStorageModule } from './oci-storage/oci-storage.module';
import { EmailModule } from './email/email.module';
import { OpenaiModule } from './openai/openai.module';
import { LoaderioController } from './loaderio/loaderio.controller';
import { MapsModule } from './maps/maps.module';
import { MoodRecordModule } from './mood-record/mood-record.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    QuestionnaireModule,
    DashboardModule,
    HealthModule,
    UploadModule,
    ConfigModule.forRoot({ isGlobal: true }),
    OciStorageModule,
    EmailModule,
    OpenaiModule,
    MapsModule,
    MoodRecordModule,
  ],
  controllers: [AppController, LoaderioController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
