export class CreateResponseDto {
  userId: string;
  questionId: string;
  value: string;
}

export class CreateBlockResponseDto {
  userId: string;
  responses: Array<{
    questionId: string;
    value: string;
  }>;
}
