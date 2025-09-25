import { Module } from '@nestjs/common';
import { OciService } from './oci-storage.service';

@Module({
  providers: [OciService],
  exports: [OciService],
})
export class OciStorageModule {}
