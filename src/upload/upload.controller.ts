/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OciService } from 'src/oci-storage/oci-storage.service';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Controller('upload')
export class UploadController {
  constructor(private readonly ociStorageService: OciService) {}

  @Post('file')
  @UseInterceptors(FileInterceptor('file')) // 'file' é o nome do campo no form-data
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('Arquivo não enviado.');
    }

    // Gera nome único
    const uniqueSuffix = uuidv4();
    const fileExtension = path.extname(file.originalname);
    const uniqueFileName = `${uniqueSuffix}${fileExtension}`;

    // Faz upload no OCI
    const fileUrl = await this.ociStorageService.uploadFile(
      file.buffer,
      uniqueFileName,
      file.mimetype,
    );

    return { url: fileUrl };
  }
}
