import { Controller, Get, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Req } from '@nestjs/common';
import { HttpCode, HttpStatus } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import type { AuthRequest } from '../auth/models/AuthRequest';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiProperty,
} from '@nestjs/swagger';

class DashboardStatsDto {
  @ApiProperty({
    description: 'Total de usuários no sistema',
    example: 150,
  })
  totalUsers: number;

  @ApiProperty({
    description: 'Total de questionários disponíveis',
    example: 25,
  })
  totalQuestionnaires: number;

  @ApiProperty({
    description: 'Total de respostas coletadas',
    example: 1250,
  })
  totalResponses: number;

  @ApiProperty({
    description: 'Questionários respondidos hoje',
    example: 15,
  })
  responsesToday: number;
}

class QuestionAnalysisDto {
  @ApiProperty({
    description: 'ID da questão analisada',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  questionId: string;

  @ApiProperty({
    description: 'Texto da questão',
    example: 'Como você se sente hoje?',
  })
  questionText: string;

  @ApiProperty({
    description: 'Total de respostas para esta questão',
    example: 87,
  })
  totalResponses: number;

  @ApiProperty({
    description: 'Distribuição das respostas',
    example: {
      'Muito bem': 25,
      Bem: 35,
      Regular: 15,
      Mal: 8,
      'Muito mal': 4,
    },
  })
  responseDistribution: Record<string, number>;

  @ApiProperty({
    description: 'Resposta mais comum',
    example: 'Bem',
  })
  mostCommonResponse: string;
}

class UserDashboardDto {
  @ApiProperty({
    description: 'Questionários respondidos pelo usuário',
    example: 12,
  })
  completedQuestionnaires: number;

  @ApiProperty({
    description: 'Questionários pendentes',
    example: 3,
  })
  pendingQuestionnaires: number;

  @ApiProperty({
    description: 'Última atividade',
    example: '2023-09-23T10:30:00Z',
  })
  lastActivity: Date;

  @ApiProperty({
    description: 'Pontuação de bem-estar atual',
    example: 7.5,
  })
  wellnessScore: number;

  @ApiProperty({
    description: 'Histórico de pontuações (últimos 7 dias)',
    example: [6.5, 7.0, 7.2, 6.8, 7.5, 7.8, 7.5],
  })
  scoreHistory: number[];
}

@ApiTags('📊 Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiOperation({
    summary: '📊 Estatísticas Gerais',
    description: `
### Dashboard Administrativo

Retorna estatísticas gerais do sistema.

**Requer:** Token JWT válido
**Acesso:** Administradores
    `,
  })
  @ApiBearerAuth('bearer')
  @ApiResponse({
    status: 200,
    description: '✅ Estatísticas retornadas com sucesso',
    type: DashboardStatsDto,
  })
  @ApiResponse({
    status: 401,
    description: '❌ Token inválido',
  })
  @ApiResponse({
    status: 403,
    description: '❌ Acesso negado - apenas administradores',
  })
  @Get()
  findAll() {
    return this.dashboardService.findAll();
  }

  @ApiOperation({
    summary: '📊 Análise de Questão',
    description: `
### Insights Detalhados

Retorna análise estatística de uma questão específica.

**Requer:** Token JWT válido
    `,
  })
  @ApiBearerAuth('bearer')
  @ApiParam({
    name: 'id',
    description: 'ID da questão a ser analisada',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Análise da questão retornada com sucesso',
    type: QuestionAnalysisDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Questão não encontrada',
  })
  @Get('question/:id/analysis')
  getQuestionAnalysis(@Param('id') questionId: string) {
    return this.dashboardService.getQuestionAnalysis(questionId);
  }

  @ApiOperation({
    summary: '👤 Dashboard do Usuário',
    description: `
### Estatísticas Pessoais

Retorna dashboard personalizado com dados do usuário logado.

**Requer:** Token JWT válido
    `,
  })
  @ApiBearerAuth('bearer')
  @ApiResponse({
    status: 200,
    description: '✅ Dashboard personalizado retornado com sucesso',
    type: UserDashboardDto,
  })
  @ApiResponse({
    status: 401,
    description: '❌ Usuário não autenticado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'User not authenticated' },
        error: { type: 'boolean', example: true },
      },
    },
  })
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
