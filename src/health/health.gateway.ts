import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { HealthService } from './health.service';
import { UpdateHealthDto } from './dto/update-health.dto';

@WebSocketGateway()
export class HealthGateway {
  constructor(private readonly healthService: HealthService) {}

  @SubscribeMessage('createHealth')
  create() {
    return this.healthService.create();
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
    return this.healthService.update(updateHealthDto.id);
  }

  @SubscribeMessage('removeHealth')
  remove(@MessageBody() id: number) {
    return this.healthService.remove(id);
  }
}
