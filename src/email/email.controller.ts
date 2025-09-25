import { Controller, Post, HttpStatus, HttpCode } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send-test')
  @HttpCode(HttpStatus.OK)
  async sendTest() {
    return await this.emailService.sendTestEmail('iury1000silva@gmail.com');
  }
}
