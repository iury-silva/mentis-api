// oci.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as common from 'oci-common';
import * as objectstorage from 'oci-objectstorage';
import * as fs from 'fs';

@Injectable()
export class OciService {
  private client: objectstorage.ObjectStorageClient;
  private bucketName: string;
  private namespaceName: string;

  constructor(private configService: ConfigService) {
    // Lê a chave privada
    const privateKey = fs.readFileSync(
      this.configService.get<string>('OCI_PRIVATE_KEY_PATH')!,
      'ascii',
    );

    // Cria o provedor de autenticação
    const region = common.Region.fromRegionId(
      this.configService.get<string>('OCI_REGION')!,
    );

    const provider = new common.SimpleAuthenticationDetailsProvider(
      this.configService.get<string>('OCI_TENANCY')!,
      this.configService.get<string>('OCI_USER')!,
      this.configService.get<string>('OCI_FINGERPRINT')!,
      privateKey,
      null, // passphrase
      region, // agora é do tipo Region
    );

    this.client = new objectstorage.ObjectStorageClient({
      authenticationDetailsProvider: provider,
    });

    // Garantindo que não seja undefined
    this.bucketName = this.configService.get<string>('OCI_BUCKET')!;
    this.namespaceName = this.configService.get<string>('OCI_NAMESPACE')!;
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
    folderPath?: string,
  ): Promise<string> {
    const objectName = folderPath ? `${folderPath}/${fileName}` : fileName;

    console.log('Uploading to bucket:', objectName);

    const request: objectstorage.requests.PutObjectRequest = {
      bucketName: this.bucketName,
      namespaceName: this.namespaceName,
      objectName: objectName,
      putObjectBody: fileBuffer,
      contentType: contentType,
    };

    await this.client.putObject(request);

    return `https://objectstorage.${this.configService.get<string>('OCI_REGION')}.oraclecloud.com/n/${this.namespaceName}/b/${this.bucketName}/o/${objectName}`;
  }

  // Método extra para URL pré-assinada (opcional)
  async generatePresignedUploadUrl(fileName: string): Promise<string> {
    const request: objectstorage.requests.CreatePreauthenticatedRequestRequest =
      {
        bucketName: this.bucketName,
        namespaceName: this.namespaceName,
        createPreauthenticatedRequestDetails: {
          name: `upload-${Date.now()}`,
          accessType:
            objectstorage.models.CreatePreauthenticatedRequestDetails.AccessType
              .ObjectWrite,
          objectName: fileName,
          timeExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
        },
      };

    const response = await this.client.createPreauthenticatedRequest(request);
    return `https://objectstorage.${this.configService.get<string>(
      'OCI_REGION',
    )}.oraclecloud.com${response.preauthenticatedRequest.accessUri}`;
  }
}
