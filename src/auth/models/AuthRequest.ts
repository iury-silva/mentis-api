import { Request } from 'express';
import { CreateAuthDto } from '../dto/create-auth.dto';

export interface AuthRequest extends Request {
  user: CreateAuthDto;
}
