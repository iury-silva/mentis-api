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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import type { AuthRequest } from './models/AuthRequest';
// import { UpdateAuthDto } from './dto/update-auth.dto';
import { IsPublic } from './decorators/is-public.decorator';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @IsPublic()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  login(@Request() req: AuthRequest) {
    return this.authService.login(req.user);
  }

  @IsPublic()
  @Get('auth/google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {
    return;
  }

  @IsPublic()
  @Get('auth/google/redirect')
  @UseGuards(GoogleAuthGuard)
  googleRedirect(@Req() req: AuthRequest) {
    console.log(req);
    return this.authService.login(req.user);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('dashboard')
  create(@Request() req: AuthRequest) {
    console.log('User:', req.user);
    return req.user;
  }
}
