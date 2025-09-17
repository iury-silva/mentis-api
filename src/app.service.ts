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
    } catch (err) {
      dbStatus = '❌ Banco offline';
    }

    // Infos do servidor
    const memoryUsage = ((os.totalmem() - os.freemem()) / 1024 / 1024).toFixed(0);
    const cpuCores = os.cpus().length;

    // HTML estilizado e fofo
    return `
      <html>
        <head>
          <title>Health Check ❤️</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              background: linear-gradient(120deg, #ffe6f0, #ffebcc);
              color: #333;
              text-align: center;
              padding: 50px;
            }
            h1 {
              color: #ff69b4;
              font-size: 3em;
            }
            p {
              font-size: 1.5em;
              margin: 10px 0;
            }
            .status {
              background: #fff0f5;
              border: 2px solid #ff69b4;
              padding: 20px;
              border-radius: 15px;
              display: inline-block;
              margin-top: 20px;
            }
            .heart {
              color: red;
              font-size: 2em;
              animation: beat 1s infinite;
            }
            @keyframes beat {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.3); }
            }
          </style>
        </head>
        <body>
          <h1>Olá minha gatinha! 🥰</h1>
          <p class="heart">❤️</p>

          <div class="status">
            <p><strong>Status do banco:</strong> ${dbStatus}</p>
            <p><strong>CPU Cores:</strong> ${cpuCores}</p>
            <p><strong>Memória usada:</strong> ${memoryUsage} MB</p>
          </div>

          <p style="margin-top:40px;">Te amo demais meu amor! 🫶</p>
        </body>
      </html>
    `;
  }
}
