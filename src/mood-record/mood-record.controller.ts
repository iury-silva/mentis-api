/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  Req,
} from '@nestjs/common';
import { MoodRecordService } from './mood-record.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateMoodDto } from './dto/create-mood-dto';
import { ResponseMoodDto } from './dto/response-mood.dto';
import type { AuthRequest } from 'src/auth/models/AuthRequest';

type FetchedData = {
  status: string;
};
@Controller('mood-record')
export class MoodRecordController {
  constructor(private readonly moodRecordService: MoodRecordService) {}

  @Get('test')
  async getTestData(): Promise<FetchedData> {
    const data = (await this.moodRecordService.fetchTestData()) as FetchedData;
    console.log('Fetched data:', data);
    return data;
  }

  @Post('analyze-voice')
  @UseInterceptors(FileInterceptor('file'))
  async analyzeMood(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthRequest,
  ): Promise<any> {
    console.log('Received file:', file);
    const result = (await this.moodRecordService.analyzeMood(
      file,
      req.user.id,
    )) as any;
    return result;
  }

  @Post('analyze-text')
  async analyzeText(
    @Body() data: CreateMoodDto,
    @Req() req: AuthRequest,
  ): Promise<any> {
    console.log('Received text:', data);
    const result = (await this.moodRecordService.AnalyseMoodText(
      data,
      req.user.id,
    )) as ResponseMoodDto;
    return result;
  }
}
