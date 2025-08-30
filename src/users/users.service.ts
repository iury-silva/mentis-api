import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/database/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createUserDto: CreateUserDto) {
    if (
      await this.prisma.user.findUnique({
        where: { email: createUserDto.email },
      })
    ) {
      throw new BadRequestException('Email already exists');
    }
    try {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      return await this.prisma.user.create({
        data: {
          ...createUserDto,
          avatar: createUserDto.avatar || '',
          password: hashedPassword,
        },
      });
    } catch {
      throw new Error('Error creating user');
    }
  }

  async findAll() {
    try {
      return await this.prisma.user.findMany();
    } catch {
      throw new Error('Error fetching users');
    }
  }

  async findByEmail(email: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { email },
      });
    } catch {
      throw new Error('Error fetching user by email');
    }
  }

  async remove(id: string) {
    try {
      const res = await this.prisma.user.delete({
        where: { id: String(id) },
      });
      return res;
    } catch {
      throw new Error('Error removing user');
    }
  }

  async findOrCreateOAuthUser(params: {
    email: string;
    name: string;
    avatar?: string;
  }) {
    let user = await this.prisma.user.findUnique({
      where: { email: params.email },
    });
    if (!user) {
      const randomPassword = crypto.randomUUID();
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      user = await this.prisma.user.create({
        data: {
          email: params.email,
          name: params.name,
          avatar: params.avatar || '',
          password: hashedPassword,
        },
      });
    }
    return user;
  }
}
