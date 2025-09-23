import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  UseGuards,
  Request,
  Get,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import type { AuthRequest } from './models/AuthRequest';
import type { Response } from 'express';
// import { UpdateAuthDto } from './dto/update-auth.dto';
import { IsPublic } from './decorators/is-public.decorator';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiProperty,
} from '@nestjs/swagger';

class LoginDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@exemplo.com',
  })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'MinhaSenh@123',
  })
  password: string;
}

class LoginResponseDto {
  @ApiProperty({
    description: 'Token JWT para autenticação',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Dados do usuário autenticado',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'usuario@exemplo.com',
      name: 'João Silva',
      role: 'user',
      avatar: 'https://exemplo.com/avatar.jpg',
    },
  })
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar?: string;
  };
}

class UserProfileDto {
  @ApiProperty({
    description: 'ID único do usuário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@exemplo.com',
  })
  email: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva',
  })
  name: string;

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
}

@ApiTags('🔐 Authentication')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: '🔑 Login com Email e Senha',
    description: `
### Autenticação Principal

Faça login com email e senha para obter um token JWT.

#### Como usar o token:
1. ✅ Copie o \`access_token\` da resposta
2. ✅ Clique em **"Authorize" 🔒** no topo da página
3. ✅ Cole APENAS o token (sem "Bearer ")
4. ✅ Agora você pode testar endpoints protegidos!

**Dica:** O token é válido por 24 horas.
    `,
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      exemplo: {
        summary: 'Usuário de teste',
        value: {
          email: 'usuario@teste.com',
          password: 'Teste123@',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      '✅ Login realizado com sucesso - Use o access_token para autorização',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas',
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: true,
    },
  })
  @IsPublic()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  login(@Request() req: AuthRequest) {
    return this.authService.login(req.user);
  }

  @ApiOperation({
    summary: '🌐 Login com Google',
    description: `
### Autenticação via Google OAuth

Inicia o processo de login com conta Google.

**Fluxo:**
1. Usuário é redirecionado para Google
2. Autoriza a aplicação
3. Retorna com token JWT
    `,
  })
  @ApiResponse({
    status: 302,
    description: '🔄 Redirecionamento para Google OAuth',
  })
  @IsPublic()
  @Get('auth/google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {
    return;
  }

  @ApiOperation({
    summary: '↩️ Callback do Google',
    description: 'Endpoint de retorno do Google OAuth (uso interno)',
  })
  @ApiResponse({
    status: 302,
    description: '🔄 Redirecionamento para frontend com token',
  })
  @IsPublic()
  @Get('auth/google/redirect')
  @UseGuards(GoogleAuthGuard)
  googleRedirect(@Req() req: AuthRequest, @Res() res: Response) {
    console.log('RES AQUI >>>>>>>>>', req);
    const userToken = this.authService.login(req.user);

    //redirecionando para uma rota no front para validar usuario e salvar o token do google
    res.redirect(
      `${process.env.FRONT_BASE_URL}/google/callback?token=${userToken.access_token}`,
    );
  }

  @ApiOperation({
    summary: '👤 Obter Perfil do Usuário',
    description: `
### Dados do Usuário Logado

Retorna informações completas do usuário autenticado.

**Requer:** Token JWT válido
    `,
  })
  @ApiBearerAuth('bearer')
  @ApiResponse({
    status: 200,
    description: '✅ Perfil retornado com sucesso',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 401,
    description: '❌ Token inválido ou não fornecido',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
        error: { type: 'boolean', example: true },
      },
    },
  })
  @Get('me')
  getProfile(@Request() req: AuthRequest) {
    return req.user;
  }
}
