import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QuestionnaireService } from './questionnaire.service';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
import { UpdateQuestionnaireDto } from './dto/update-questionnaire.dto';
import { CreateBlockResponseDto } from './dto/create-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiProperty,
} from '@nestjs/swagger';

class QuestionnaireResponseDto {
  @ApiProperty({
    description: 'ID único do questionário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Título do questionário',
    example: 'Questionário de Bem-estar Mental',
  })
  title: string;

  @ApiProperty({
    description: 'Descrição detalhada do questionário',
    example:
      'Questionário para avaliar o estado de bem-estar mental do usuário',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2023-09-23T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2023-09-23T10:30:00Z',
  })
  updatedAt: Date;
}

class QuestionDto {
  @ApiProperty({
    description: 'ID único da questão',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Texto da questão',
    example: 'Como você se sente hoje?',
  })
  text: string;

  @ApiProperty({
    description: 'Tipo da questão',
    example: 'multiple_choice',
    enum: ['multiple_choice', 'text', 'scale', 'boolean'],
  })
  type: string;

  @ApiProperty({
    description: 'Opções de resposta (para questões de múltipla escolha)',
    example: ['Muito bem', 'Bem', 'Regular', 'Mal', 'Muito mal'],
    required: false,
  })
  options?: string[];
}

class ResponseDto {
  @ApiProperty({
    description: 'ID único da resposta',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'ID do usuário que respondeu',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'ID da questão respondida',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  questionId: string;

  @ApiProperty({
    description: 'Valor da resposta',
    example: 'Muito bem',
  })
  value: string;

  @ApiProperty({
    description: 'Data da resposta',
    example: '2023-09-23T10:30:00Z',
  })
  createdAt: Date;
}

@ApiTags('📝 Questionnaires')
@Controller('questionnaire')
export class QuestionnaireController {
  constructor(private readonly questionnaireService: QuestionnaireService) {}

  @ApiOperation({
    summary: '🆕 Criar Questionário',
    description: `
### Novo Questionário

Cria um novo questionário no sistema.

**Requer:** Token JWT válido
    `,
  })
  @ApiBearerAuth('bearer')
  @ApiResponse({
    status: 201,
    description: '✅ Questionário criado com sucesso',
    type: QuestionnaireResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos fornecidos',
  })
  @Post()
  create(@Body() createQuestionnaireDto: CreateQuestionnaireDto) {
    return this.questionnaireService.create(createQuestionnaireDto);
  }

  @ApiOperation({
    summary: '📋 Listar Questionários',
    description: `
### Todos os Questionários

Retorna questionários disponíveis, com filtro opcional por usuário.

**Requer:** Token JWT válido
    `,
  })
  @ApiBearerAuth('bearer')
  @ApiQuery({
    name: 'userId',
    description: 'ID do usuário para filtrar questionários',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: '✅ Lista de questionários retornada com sucesso',
    type: [QuestionnaireResponseDto],
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query: { userId?: string }) {
    return this.questionnaireService.findAll(query.userId);
  }

  @ApiOperation({
    summary: '🧩 Questões por Bloco',
    description: `
### Obter Questões de um Bloco

Retorna todas as questões de um bloco específico.

**Requer:** Token JWT válido
    `,
  })
  @ApiBearerAuth('bearer')
  @ApiParam({
    name: 'id',
    description: 'ID do bloco de questões',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Questões do bloco retornadas com sucesso',
    type: [QuestionDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Bloco não encontrado',
  })
  @Get('/blocks/:id')
  @HttpCode(HttpStatus.OK)
  getQuestionsByBlock(@Param('id') blockId: string) {
    return this.questionnaireService.getQuestionsByBlock(blockId);
  }

  @ApiOperation({
    summary: '🔍 Obter Questionário por ID',
    description: `
### Questionário Específico

Retorna detalhes de um questionário pelo seu ID.

**Requer:** Token JWT válido
    `,
  })
  @ApiBearerAuth('bearer')
  @ApiParam({
    name: 'id',
    description: 'ID do questionário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: '✅ Questionário encontrado com sucesso',
    type: QuestionnaireResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '❌ Questionário não encontrado',
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questionnaireService.findOne(id);
  }

  @ApiOperation({
    summary: '✏️ Atualizar Questionário',
    description: `
### Modificar Questionário

Atualiza informações de um questionário existente.

**Requer:** Token JWT válido
    `,
  })
  @ApiBearerAuth('bearer')
  @ApiParam({
    name: 'id',
    description: 'ID do questionário a ser atualizado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Questionário atualizado com sucesso',
    type: QuestionnaireResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Questionário não encontrado',
  })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateQuestionnaireDto: UpdateQuestionnaireDto,
  ) {
    return this.questionnaireService.update(id, updateQuestionnaireDto);
  }

  @ApiOperation({
    summary: 'Remover questionário',
    description: 'Remove um questionário do sistema',
  })
  @ApiBearerAuth('bearer')
  @ApiParam({
    name: 'id',
    description: 'ID do questionário a ser removido',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Questionário removido com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Questionário não encontrado',
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.questionnaireService.remove(id);
  }

  @ApiOperation({
    summary: '💾 Salvar Respostas',
    description: `
### Enviar Respostas do Bloco

Salva todas as respostas de um bloco de questões.

**Requer:** Token JWT válido
    `,
  })
  @ApiBearerAuth('bearer')
  @ApiResponse({
    status: 201,
    description: '✅ Respostas salvas com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Responses saved successfully' },
        count: { type: 'number', example: 5 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dados de resposta inválidos',
  })
  @Post('responses')
  @HttpCode(HttpStatus.CREATED)
  saveResponses(@Body() responseDto: CreateBlockResponseDto) {
    return this.questionnaireService.saveBlockResponses(responseDto);
  }

  @ApiOperation({
    summary: '📄 Obter Respostas do Usuário',
    description: `
### Histórico de Respostas

Retorna todas as respostas de um usuário para um bloco específico.

**Requer:** Token JWT válido
    `,
  })
  @ApiBearerAuth('bearer')
  @ApiParam({
    name: 'userId',
    description: 'ID do usuário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'blockId',
    description: 'ID do bloco de questões',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Respostas do usuário retornadas com sucesso',
    type: [ResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário ou bloco não encontrado',
  })
  @Get('responses/:userId/:blockId')
  @HttpCode(HttpStatus.OK)
  getUserResponses(
    @Param('userId') userId: string,
    @Param('blockId') blockId: string,
  ) {
    return this.questionnaireService.getUserResponses(userId, blockId);
  }
}
