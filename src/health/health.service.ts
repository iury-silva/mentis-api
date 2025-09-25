import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  create() {
    return 'This action adds a new health';
  }

  findAll() {
    return `This action returns all health`;
  }

  findOne(id: number) {
    return `This action returns a #${id} health`;
  }

  update(id: number) {
    return `This action updates a #${id} health`;
  }

  remove(id: number) {
    return `This action removes a #${id} health`;
  }
}
