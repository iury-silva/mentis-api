/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendTestEmail(to: string) {
    try {
      const res = await this.mailerService.sendMail({
        to,
        subject: 'Teste de E-mail',
        template: 'teste', // Nome do template sem extensão
        context: {
          email: to,
        },
      });
      return {
        message: 'E-mail enviado com sucesso',
        response: res,
      };
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error);
      return {
        message: 'Erro ao enviar e-mail',
        error,
      };
    }
  }
}
