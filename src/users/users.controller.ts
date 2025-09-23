import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiProperty,
} from '@nestjs/swagger';

class UserResponseDto {
  @ApiProperty({
    description: 'ID único do usuário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva',
  })
  name: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@exemplo.com',
  })
  email: string;

  @ApiProperty({
    description: 'Role do usuário no sistema',
    example: 'user',
    enum: ['user', 'admin'],
  })
  role: string;

  @ApiProperty({
    description: 'URL do avatar do usuário',
    example: 'https://exemplo.com/avatar.jpg',
    required: false,
  })
  avatar?: string;

  @ApiProperty({
    description: 'Data de criação do usuário',
    example: '2023-09-23T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2023-09-23T10:30:00Z',
  })
  updatedAt: Date;
}

@ApiTags('👥 Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: '🆕 Criar Novo Usuário',
    description: `
### Registro de Usuário

Cria uma nova conta de usuário no sistema.

**Status:** Público (não requer autenticação)

#### Validações:
- ✅ Email válido e único
- ✅ Senha forte (mín. 6 chars, 1 maiúscula, 1 minúscula, 1 número)
- ✅ Nome com pelo menos 2 caracteres
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos fornecidos',
    example: {
      statusCode: 400,
      message: ['email must be a valid email', 'password is too weak'],
      error: true,
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Email já está em uso',
    example: {
      statusCode: 409,
      message: 'Email already exists',
      error: true,
    },
  })
  @IsPublic()
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @ApiOperation({
    summary: '📋 Listar Todos os Usuários',
    description: `
### Lista Completa de Usuários

Retorna todos os usuários cadastrados no sistema.

**Requer:** Token JWT válido
    `,
  })
  @ApiBearerAuth('bearer')
  @ApiResponse({
    status: 200,
    description: '✅ Lista de usuários retornada com sucesso',
    type: [UserResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: '❌ Token de acesso inválido ou não fornecido',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
        error: { type: 'boolean', example: true },
      },
    },
  })
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({
    summary: '🗑️ Remover Usuário',
    description: `
### Exclusão de Usuário

Remove um usuário específico do sistema.

**Requer:** Token JWT válido
**Atenção:** Ação irreversível!
    `,
  })
  @ApiBearerAuth('bearer')
  @ApiParam({
    name: 'id',
    description: 'ID único do usuário a ser removido',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário removido com sucesso',
    example: {
      message: 'User deleted successfully',
      id: '123e4567-e89b-12d3-a456-426614174000',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
    example: {
      statusCode: 404,
      message: 'User not found',
      error: true,
    },
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
