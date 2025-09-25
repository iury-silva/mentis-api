import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.OCI_EMAIL_HOST,
        port: Number(process.env.OCI_EMAIL_PORT),
        auth: {
          user: process.env.OCI_EMAIL_USER,
          pass: process.env.OCI_EMAIL_PASS,
        },
      },
      defaults: {
        from: `"Mentis" <${process.env.OCI_EMAIL_FROM}>`,
      },
      template: {
        dir: process.cwd() + '/src/templates/',
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  controllers: [EmailController],
  providers: [EmailService],
})
export class EmailModule {}
