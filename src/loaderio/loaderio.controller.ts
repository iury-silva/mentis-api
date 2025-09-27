import { Controller, Get } from '@nestjs/common';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';

@Controller()
export class LoaderioController {
  @IsPublic()
  @Get('loaderio-5d2a53b7f3d3091f859aab5f685579e9.txt')
  verifyToken(): string {
    return 'loaderio-5d2a53b7f3d3091f859aab5f685579e9';
  }
}
