/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  Req,
  Query,
  Delete,
  Param,
} from '@nestjs/common';
import { MoodRecordService } from './mood-record.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateMoodDto } from './dto/create-mood-dto';
import { ResponseMoodDto } from './dto/response-mood.dto';
import type { AuthRequest } from 'src/auth/models/AuthRequest';

@Controller('mood-record')
export class MoodRecordController {
  constructor(private readonly moodRecordService: MoodRecordService) {}

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

  // Historico completo com paginacao
  @Get('history')
  async getMoodHistory(
    @Req() req: AuthRequest,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return await this.moodRecordService.getMoodHistory(
      req.user.id,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  // Verificar registro de hoje
  @Get('today')
  async checkTodayMoodRecord(@Req() req: AuthRequest) {
    return await this.moodRecordService.hasMoodRecordToday(req.user.id);
  }

  // Deletar registro de humor
  @Delete('delete/:id')
  async deleteMoodRecord(
    @Req() req: AuthRequest,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return await this.moodRecordService.deleteMoodRecord(id, req.user.id);
  }
}
