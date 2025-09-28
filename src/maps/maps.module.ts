import { Module } from '@nestjs/common';
import { MapsService } from './maps.service';
import { MapsController } from './maps.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: () => ({
        maxRedirects: 5,
      }),
    }),
  ],
  controllers: [MapsController],
  providers: [MapsService],
})
export class MapsModule {}
