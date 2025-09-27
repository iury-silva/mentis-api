/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OciService } from 'src/oci-storage/oci-storage.service';
import { v4 as uuidv4 } from 'uuid';
// import * as path from 'path';

@Controller('upload')
export class UploadController {
  constructor(private readonly ociStorageService: OciService) {}

  @Post('file')
  @UseInterceptors(FileInterceptor('file')) // 'file' é o nome do campo no form-data
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folderPath') folderPath?: string,
    @Body('fileName') fileName?: string,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new Error('Arquivo não enviado.');
    }

    // Gera nome único
    const uniqueSuffix = uuidv4();
    const uniqueFileName = fileName ? `${uniqueSuffix}${fileName}` : '';

    const fileFinalName = folderPath ? folderPath : uniqueFileName;

    // Faz upload no OCI
    const fileUrl = await this.ociStorageService.uploadFile(
      file.buffer,
      file.mimetype,
      fileFinalName,
    );

    return { url: fileUrl };
  }

  @Post('presigned-url')
  async generatePresignedUrl(
    @Body('fileName') fileName: string,
  ): Promise<{ url: string }> {
    const url =
      await this.ociStorageService.generatePresignedUploadUrl(fileName);
    return { url };
  }
}
