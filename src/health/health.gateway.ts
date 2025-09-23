import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { HealthService } from './health.service';
import { CreateHealthDto } from './dto/create-health.dto';
import { UpdateHealthDto } from './dto/update-health.dto';

@WebSocketGateway()
export class HealthGateway {
  constructor(private readonly healthService: HealthService) {}

  @SubscribeMessage('createHealth')
  create(@MessageBody() createHealthDto: CreateHealthDto) {
    return this.healthService.create(createHealthDto);
  }

  @SubscribeMessage('findAllHealth')
  findAll() {
    return this.healthService.findAll();
  }

  @SubscribeMessage('findOneHealth')
  findOne(@MessageBody() id: number) {
    return this.healthService.findOne(id);
  }

  @SubscribeMessage('updateHealth')
  update(@MessageBody() updateHealthDto: UpdateHealthDto) {
    return this.healthService.update(updateHealthDto.id, updateHealthDto);
  }

  @SubscribeMessage('removeHealth')
  remove(@MessageBody() id: number) {
    return this.healthService.remove(id);
  }
}
