import { Module } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthGateway } from './health.gateway';

@Module({
  providers: [HealthGateway, HealthService],
})
export class HealthModule {}
