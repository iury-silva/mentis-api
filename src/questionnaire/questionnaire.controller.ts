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
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthRequest } from 'src/auth/models/AuthRequest';
import { QuestionnaireService } from './questionnaire.service';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
import { UpdateQuestionnaireDto } from './dto/update-questionnaire.dto';
import { CreateBlockResponseDto } from './dto/create-response.dto';
import { RolesGuard } from 'src/auth/guards/roles-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
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

  @Get('/blocks/:id/access')
  @HttpCode(HttpStatus.OK)
  checkBlockAccess(
    @Param('id') blockId: string,
    @Query('userId') userId: string,
  ) {
    return this.questionnaireService.checkBlockAccess(blockId, userId);
  }

  @Roles('admin')
  @UseGuards(RolesGuard)
  @Get('demographics')
  @HttpCode(HttpStatus.OK)
  getDemographics() {
    return this.questionnaireService.getDemographics();
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

  @Get('bonus/:blockId')
  @HttpCode(HttpStatus.OK)
  getBonusLink(@Param('blockId') blockId: string) {
    return this.questionnaireService.getBonusLink(blockId);
  }

  @Post('consent')
  @HttpCode(HttpStatus.CREATED)
  createConsent(
    @Body()
    createConsentDto: {
      cpf: string;
      name: string;
      city: string;
    },
    @Req() req: AuthRequest,
  ) {
    return this.questionnaireService.createConsent(
      req.user.id || '',
      createConsentDto.cpf,
      createConsentDto.name,
      createConsentDto.city,
    );
  }
  //Criar questão para x determinado bloco
  @Post('question/create/:blockId')
  @HttpCode(HttpStatus.CREATED)
  createQuestion(
    @Param('blockId') blockId: string,
    @Body()
    createQuestionDto: {
      question: string;
      type: string;
      options?: string[];
      order: number;
    },
  ) {
    return this.questionnaireService.createQuestion(blockId, createQuestionDto);
  }
}
