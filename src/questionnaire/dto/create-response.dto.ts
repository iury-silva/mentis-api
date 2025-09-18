export class CreateResponseDto {
  userId: string;
  questionId: string;
  selectedOptionId: string;
}

export class CreateBlockResponseDto {
  userId: string;
  responses: Array<{
    questionId: string;
    selectedOptionId: string;
  }>;
}
