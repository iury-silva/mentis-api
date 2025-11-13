import { Test, TestingModule } from '@nestjs/testing';
import { MoodRecordController } from './mood-record.controller';
import { MoodRecordService } from './mood-record.service';

describe('MoodRecordController', () => {
  let controller: MoodRecordController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoodRecordController],
      providers: [MoodRecordService],
    }).compile();

    controller = module.get<MoodRecordController>(MoodRecordController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
