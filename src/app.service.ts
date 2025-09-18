import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as os from 'os';

const prisma = new PrismaClient();

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async getHealthCheck(): Promise<string> {
    // Checando banco de dados
    let dbStatus = '❌ Banco offline';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = '✅ Banco online';
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      dbStatus = `❌ Banco offline: ${message}`;
    }

    // Infos do servidor
    const memoryUsage = ((os.totalmem() - os.freemem()) / 1024 / 1024).toFixed(
      0,
    );
    const cpuCores = os.cpus().length;

    // HTML estilizado e fofo
    return `
      <html>
        <head>
          <title>Mentis API - Health Check</title>
        </head>
        <body>
          <div class="status">
            <p><strong>Status do banco:</strong> ${dbStatus}</p>
            <p><strong>CPU Cores:</strong> ${cpuCores}</p>
            <p><strong>Memória usada:</strong> ${memoryUsage} MB</p>
          </div>
        </body>
      </html>
    `;
  }
}
