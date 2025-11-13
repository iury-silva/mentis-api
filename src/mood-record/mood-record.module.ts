import { Module } from '@nestjs/common';
import { MoodRecordService } from './mood-record.service';
import { MoodRecordController } from './mood-record.controller';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: () => ({
        maxRedirects: 5,
      }),
    }),
  ],
  controllers: [MoodRecordController],
  providers: [MoodRecordService, PrismaService],
})
export class MoodRecordModule {}
