import { ApiProperty } from '@nestjs/swagger';

class ResponseItemDto {
  @ApiProperty({
    description: 'ID da questão respondida',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  questionId: string;

  @ApiProperty({
    description: 'Valor da resposta fornecida',
    example: 'Muito bem',
  })
  value: string;
}

export class CreateResponseDto {
  @ApiProperty({
    description: 'ID do usuário que está respondendo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'ID da questão sendo respondida',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  questionId: string;

  @ApiProperty({
    description: 'Valor da resposta',
    example: 'Muito bem',
  })
  value: string;
}

export class CreateBlockResponseDto {
  @ApiProperty({
    description: 'ID do usuário que está respondendo o bloco',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'ID do bloco sendo respondido',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  blockId: string;

  @ApiProperty({
    description: 'Array com todas as respostas do bloco',
    type: [ResponseItemDto],
    example: [
      {
        questionId: '123e4567-e89b-12d3-a456-426614174000',
        value: 'Muito bem',
      },
      {
        questionId: '123e4567-e89b-12d3-a456-426614174001',
        value: '8',
      },
    ],
  })
  responses: Array<{
    questionId: string;
    value: string;
  }>;
}
