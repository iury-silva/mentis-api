import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @IsPublic()
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Put(':id/first-access')
  setFirstAccess(@Param('id') id: string) {
    return this.usersService.setFirstAccess(id);
  }

  @Put('/complete-profile/:id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: Partial<UpdateUserDto>,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Get('/get-profile/:id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get('/verify-email')
  @IsPublic()
  verifyEmail(@Req() req: { query: { token: string } }) {
    const { token } = req.query;
    return this.usersService.verifyEmail(token);
  }
}
