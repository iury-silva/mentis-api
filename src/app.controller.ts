import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { IsPublic } from './auth/decorators/is-public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';

@ApiTags('🏠 Application')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({
    summary: '👋 Boas-vindas da API Mentis',
    description: `
### Endpoint de Verificação

Endpoint básico para verificar se a API está funcionando corretamente.

**Status:** Público (não requer autenticação)
    `,
  })
  @ApiResponse({
    status: 200,
    description: '✅ API funcionando corretamente',
    schema: {
      type: 'string',
      example: 'Hello World!',
    },
  })
  @IsPublic()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @ApiExcludeEndpoint()
  @IsPublic()
  @Get('/hello')
  getHealthCheck(): Promise<string> {
    return this.appService.getHealthCheck();
  }
}
