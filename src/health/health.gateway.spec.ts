import { Test, TestingModule } from '@nestjs/testing';
import { HealthGateway } from './health.gateway';
import { HealthService } from './health.service';

describe('HealthGateway', () => {
  let gateway: HealthGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthGateway, HealthService],
    }).compile();

    gateway = module.get<HealthGateway>(HealthGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
