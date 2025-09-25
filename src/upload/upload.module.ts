import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { OciService } from '../oci-storage/oci-storage.service';

@Module({
  controllers: [UploadController],
  providers: [UploadService, OciService],
})
export class UploadModule {}
