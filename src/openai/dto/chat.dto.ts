import { IsArray, ValidateNested, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class MessageDto {
  @IsIn(['system', 'user', 'assistant'])
  role: 'system' | 'user' | 'assistant';

  @IsString()
  content: string;
}

export class CreateChatDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages: MessageDto[];
}

export class ChatCompletionDto {
  @IsString()
  content: string;

  @IsIn(['system', 'user', 'assistant'])
  role: string;
}
