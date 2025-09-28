import { Controller, Post, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { MapsService } from './maps.service';

@Controller('maps')
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  // Métodos do controlador que utilizam o MapsService
  @Post('nearby-places')
  @HttpCode(HttpStatus.OK)
  async getNearbyPlaces(
    @Body() body: { lat: number; lon: number; amenity: string },
  ) {
    const { lat, lon, amenity } = body;
    return await this.mapsService.findNearby(lat, lon, amenity);
  }
}
