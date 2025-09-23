/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('🧠 Mentis API')
    .setDescription(
      `# API Mentis - Plataforma de Bem-estar Mental\n\n## 🔐 Como Usar a Autenticação\n\n### Passo 1: Faça Login\n1. Use o endpoint **POST /login** com email e senha\n2. Copie o \`access_token\` retornado\n\n### Passo 2: Autorize no Swagger\n1. Clique no botão **"Authorize" 🔒** no topo\n2. Cole APENAS o token (sem "Bearer ")\n3. Clique em "Authorize"\n\n### Passo 3: Teste os Endpoints\nAgora todos os endpoints protegidos funcionarão! ✅\n\n**Nota:** O prefixo "Bearer " é adicionado automaticamente.`,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Cole APENAS o token JWT (sem "Bearer ")',
        in: 'header',
      },
      'bearer',
    )
    .addTag('🏠 Application', 'Endpoints básicos da aplicação')
    .addTag(
      '🔐 Authentication',
      'Login JWT e Google OAuth - Endpoints públicos',
    )
    .addTag('👥 Users', 'Gerenciamento de usuários')
    .addTag('📝 Questionnaires', 'Sistema de questionários por blocos')
    .addTag('📊 Dashboard', 'Analytics e estatísticas detalhadas')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.useGlobalPipes(new ValidationPipe());

  // Filtro simples que sempre manda erro pro frontend
  app.useGlobalFilters({
    catch(exception, host) {
      const response = host.switchToHttp().getResponse();
      const status = exception?.getStatus?.() || 500;
      const message = exception?.message || 'Erro interno';

      response.status(status).json({
        statusCode: status,
        message: message,
        error: true,
      });
    },
  });

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
  //cors
}
void bootstrap();
