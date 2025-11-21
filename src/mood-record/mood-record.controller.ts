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
  Res,
} from '@nestjs/common';
import { MoodRecordService } from './mood-record.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateMoodDto } from './dto/create-mood-dto';
import { ResponseMoodDto } from './dto/response-mood.dto';
import type { AuthRequest } from 'src/auth/models/AuthRequest';
import type { Response } from 'express';

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

  // Dados por período customizado
  @Get('range')
  async getByDateRange(
    @Req() req: AuthRequest,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return await this.moodRecordService.getByDateRange(
      new Date(startDate),
      new Date(endDate),
      req.user.id,
    );
  }

  @Get('compare-periods')
  async comparePeriods(
    @Req() req: AuthRequest,
    @Query('period') period: 'week' | 'month' | 'year',
  ) {
    return await this.moodRecordService.comparePeriods(period, req.user.id);
  }

  @Get('stats')
  async getMoodStats(@Req() req: AuthRequest) {
    return await this.moodRecordService.getStatsOverview(req.user.id);
  }

  // Gerar relatório PDF
  @Get('report/pdf')
  async generatePdfReport(
    @Req() req: AuthRequest,
    @Res() res: Response,
  ): Promise<void> {
    if (!req.user?.id) {
      throw new Error('User ID not found in request');
    }
    return await this.moodRecordService.generatePdfReport(req.user.id, res);
  }
}
