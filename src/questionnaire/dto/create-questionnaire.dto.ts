import { ApiProperty } from '@nestjs/swagger';

export class CreateQuestionnaireDto {
  @ApiProperty({
    description: 'ID único do questionário (opcional para criação)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  id?: string;

  @ApiProperty({
    description: 'Título do questionário',
    example: 'Questionário de Bem-estar Mental',
  })
  title: string;

  @ApiProperty({
    description: 'Descrição detalhada do questionário',
    example:
      'Este questionário tem como objetivo avaliar o estado atual de bem-estar mental',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Data de criação (preenchida automaticamente)',
    example: '2023-09-23T10:30:00Z',
    required: false,
  })
  createdAt?: Date;

  @ApiProperty({
    description: 'Data da última atualização (preenchida automaticamente)',
    example: '2023-09-23T10:30:00Z',
    required: false,
  })
  updatedAt?: Date;
}
