import { Controller, Get, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Req } from '@nestjs/common';
import { HttpCode, HttpStatus } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import type { AuthRequest } from '../auth/models/AuthRequest';
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  findAll() {
    return this.dashboardService.findAll();
  }

  @Get('question/:id/analysis')
  getQuestionAnalysis(@Param('id') questionId: string) {
    return this.dashboardService.getQuestionAnalysis(questionId);
  }

  @Get('user/')
  @HttpCode(HttpStatus.OK)
  getUserDashboard(@Req() req: AuthRequest) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.dashboardService.getUserDashboard(userId);
  }
}
