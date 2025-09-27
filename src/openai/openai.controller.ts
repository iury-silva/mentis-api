import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { CreateChatDto } from './dto/chat.dto';

@Controller('openai')
export class OpenaiController {
  constructor(private readonly openaiService: OpenaiService) {}

  @Post('/chat')
  @HttpCode(HttpStatus.OK)
  async createChatCompletion(@Body() body: CreateChatDto) {
    console.log('Received body:', body);
    return await this.openaiService.createChatCompletion(body);
  }
}
