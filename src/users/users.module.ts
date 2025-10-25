import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from 'src/database/prisma.service';
import { EmailService } from 'src/email/email.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService, EmailService],
  exports: [UsersService], // Export UsersService for use in other modules
})
export class UsersModule {}
