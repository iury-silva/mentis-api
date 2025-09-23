/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
