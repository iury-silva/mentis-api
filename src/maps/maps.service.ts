/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface Place {
  id: number;
  type: 'node' | 'way' | 'relation';
  name: string | null;
  lat: number | null; // permitir null
  lon: number | null; // permitir null
  amenity: string | null;
  phone: string | null;
  website: string | null;
}

export interface OverpassElement {
  id: number;
  type: 'node' | 'way' | 'relation';
  tags?: {
    name?: string;
    amenity?: string;
    phone?: string;
    website?: string;
  };
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
}

@Injectable()
export class MapsService {
  constructor(private readonly httpService: HttpService) {}

  async findNearby(
    lat: number,
    lon: number,
    amenity: string,
    radius = 10000,
  ): Promise<Place[]> {
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"~"${amenity}"](around:${radius},${lat},${lon});
        way["amenity"~"${amenity}"](around:${radius},${lat},${lon});
        relation["amenity"~"${amenity}"](around:${radius},${lat},${lon});
      );
      out center;
    `;

    const url = 'https://overpass-api.de/api/interpreter';

    const response = await firstValueFrom(
      this.httpService.post(url, query, {
        headers: { 'Content-Type': 'text/plain' },
      }),
    );
    const data: { elements: OverpassElement[] } = response.data;

    const elements: Place[] = data.elements.map((el) => ({
      id: el.id,
      type: el.type,
      name: el.tags?.name || null,
      lat: el.lat ?? el.center?.lat ?? null,
      lon: el.lon ?? el.center?.lon ?? null,
      amenity: el.tags?.amenity || null,
      phone: el.tags?.phone || null,
      website: el.tags?.website || null,
    }));

    return elements;
  }
}
