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
  googleRedirect(@Req() req: AuthRequest, @Res() res: Response) {
    console.log('RES AQUI >>>>>>>>>', req);
    const userToken = this.authService.login(req.user);

    //redirecionando para uma rota no front para validar usuario e salvar o token do google
    res.redirect(
      `${process.env.FRONT_BASE_URL}/google/callback?token=${userToken.access_token}`,
    );
  }

  @Get('me')
  getProfile(@Request() req: AuthRequest) {
    return req.user;
  }
}
