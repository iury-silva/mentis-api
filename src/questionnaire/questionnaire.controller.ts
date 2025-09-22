import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QuestionnaireService } from './questionnaire.service';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
import { UpdateQuestionnaireDto } from './dto/update-questionnaire.dto';
import { CreateBlockResponseDto } from './dto/create-response.dto';

@Controller('questionnaire')
export class QuestionnaireController {
  constructor(private readonly questionnaireService: QuestionnaireService) {}

  @Post()
  create(@Body() createQuestionnaireDto: CreateQuestionnaireDto) {
    return this.questionnaireService.create(createQuestionnaireDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query: { userId?: string }) {
    return this.questionnaireService.findAll(query.userId);
  }

  @Get('/blocks/:id')
  @HttpCode(HttpStatus.OK)
  getQuestionsByBlock(@Param('id') blockId: string) {
    return this.questionnaireService.getQuestionsByBlock(blockId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questionnaireService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateQuestionnaireDto: UpdateQuestionnaireDto,
  ) {
    return this.questionnaireService.update(id, updateQuestionnaireDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.questionnaireService.remove(id);
  }

  @Post('responses')
  @HttpCode(HttpStatus.CREATED)
  saveResponses(@Body() responseDto: CreateBlockResponseDto) {
    return this.questionnaireService.saveBlockResponses(responseDto);
  }

  @Get('responses/:userId/:blockId')
  @HttpCode(HttpStatus.OK)
  getUserResponses(
    @Param('userId') userId: string,
    @Param('blockId') blockId: string,
  ) {
    return this.questionnaireService.getUserResponses(userId, blockId);
  }
}
