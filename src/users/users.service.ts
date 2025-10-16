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
          type_login: 'normal',
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
      await this.prisma.userAnswer.deleteMany({
        where: { userId: id },
      });
      await this.prisma.user.delete({
        where: { id },
      });

      return { message: 'User deleted successfully' };
    } catch {
      throw new Error('Error deleting user');
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
          type_login: 'oauth',
        },
      });
    }
    return user;
  }

  async setFirstAccess(id: string) {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: { first_access: false },
      });
      return user;
    } catch {
      throw new Error('Error updating first access');
    }
  }

  async update(id: string, data: Partial<CreateUserDto>) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data,
      });
    } catch {
      throw new Error('Error updating user');
    }
  }

  async findOne(id: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { id },
      });
    } catch {
      throw new Error('Error fetching user');
    }
  }
}
