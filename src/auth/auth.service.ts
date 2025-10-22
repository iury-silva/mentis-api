import { Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
// import { UpdateAuthDto } from './dto/update-auth.dto';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { UserPayload } from './models/UserPayload';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return {
        ...user,
        password: undefined, // Exclude password from the returned user object
      };
    }
    return null;
  }
  login(user: CreateAuthDto) {
    const payload: UserPayload = {
      name: user.name ?? '',
      sub: user.id ?? '',
      email: user.email ?? '',
      role: user.role,
      avatar: user.avatar ?? '',
      city: user.city ?? '',
      state: user.state ?? '',
      phone: user.phone ?? '',
      verify_email: user.verify_email ?? false,
      verify_token: user.verify_token ?? '',
      type_login: user.type_login ?? 'normal',
      first_access: user.first_access ?? false,
    };

    if (!user.verify_email) {
      return {
        message: 'Email not verified',
        status: 401,
        error: 'Unauthorized',
      };
    }

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar || '',
        city: user.city || '',
        state: user.state || '',
        phone: user.phone || '',
        type_login: user.type_login || 'normal',
        first_access: user.first_access || false,
      },
    };
  }
}
