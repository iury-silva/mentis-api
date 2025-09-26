import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: unknown, user: any) {
    if (err) {
      throw new UnauthorizedException(
        (err as Error)?.message || 'Unauthorized',
      );
    }

    if (!user) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Invalid credentials',
        error: 'Bad Request',
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return user;
  }
}
