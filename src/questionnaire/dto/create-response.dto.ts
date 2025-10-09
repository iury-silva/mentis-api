class ResponseItemDto {
  questionId: string;
  value: string;
}

export class CreateResponseDto {
  userId: string;
  questionId: string;
  value: string;
}

export class CreateBlockResponseDto {
  userId: string;
  blockId: string;
  responses: Array<ResponseItemDto>;
}
