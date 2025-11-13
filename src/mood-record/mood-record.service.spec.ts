import { Test, TestingModule } from '@nestjs/testing';
import { MoodRecordService } from './mood-record.service';

describe('MoodRecordService', () => {
  let service: MoodRecordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MoodRecordService],
    }).compile();

    service = module.get<MoodRecordService>(MoodRecordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
