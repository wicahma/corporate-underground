import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListPartsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp');
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StorageService {
  private s3: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.bucket = config.get<string>('S3_BUCKET') || 'corporate-underground-media';
    this.publicUrl = config.get<string>('S3_PUBLIC_URL') || '';

    this.s3 = new S3Client({
      region: config.get<string>('S3_REGION') || 'auto',
      endpoint: config.get<string>('S3_ENDPOINT'),
      credentials: {
        accessKeyId: config.get<string>('S3_ACCESS_KEY_ID') || '',
        secretAccessKey: config.get<string>('S3_SECRET_ACCESS_KEY') || '',
      },
      forcePathStyle: config.get<string>('S3_FORCE_PATH_STYLE') === 'true',
    });
  }

  async uploadImage(buffer: Buffer, key: string, contentType: string): Promise<{ url: string; width?: number; height?: number }> {
    let processedBuffer = buffer;
    let width: number | undefined;
    let height: number | undefined;

    if (contentType.startsWith('image/')) {
      const image = sharp(buffer);
      const metadata = await image.metadata();
      width = metadata.width;
      height = metadata.height;

      processedBuffer = await image
        .webp({ quality: 85 })
        .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
        .toBuffer();

      key = key.replace(/\.[^.]+$/, '.webp');
      contentType = 'image/webp';
    }

    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: processedBuffer,
      ContentType: contentType,
    }));

    const url = `${this.publicUrl}/${key}`;
    return { url, width, height };
  }

  async uploadMultipleImages(userId: string, files: Express.Multer.File[]) {
    const results = [];
    for (const file of files) {
      const ext = 'webp';
      const fileId = crypto.randomUUID();
      const key = `posts/${userId}/${fileId}.${ext}`;

      const { url, width, height } = await this.uploadImage(file.buffer, key, file.mimetype);

      const media = await this.prisma.mediaFile.create({
        data: {
          userId,
          objectKey: key,
          originalName: file.originalname,
          mimeType: 'image/webp',
          size: file.size,
          width,
          height,
        },
      });

      results.push({ id: media.id, url, key, width, height });
    }
    return results;
  }

  async initiateMultipartUpload(userId: string, filename: string, contentType: string, partsCount = 1) {
    const fileId = crypto.randomUUID();
    const key = `uploads/${userId}/${fileId}-${filename}`;

    const command = new CreateMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    const { UploadId } = await this.s3.send(command);

    const partUrls = [];
    for (let i = 1; i <= partsCount; i++) {
      const partCommand = new UploadPartCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId,
        PartNumber: i,
      });
      const presignedUrl = await getSignedUrl(this.s3, partCommand, { expiresIn: 3600 });
      partUrls.push({ partNumber: i, presignedUrl });
    }

    return { uploadId: UploadId, key, partUrls };
  }

  async getUploadPartUrl(uploadId: string, key: string, partNumber: number) {
    const command = new UploadPartCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });
    const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
    return { partNumber, url };
  }

  async getUploadStatus(uploadId: string, key: string) {
    const command = new ListPartsCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
    });
    const res = await this.s3.send(command);
    return { parts: res.Parts || [] };
  }

  async completeMultipartUpload(
    userId: string,
    uploadId: string,
    key: string,
    parts: { ETag: string; PartNumber: number }[],
    metadata: { originalName: string; mimeType: string; size: number },
  ) {
    const command = new CompleteMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    });
    await this.s3.send(command);

    const media = await this.prisma.mediaFile.create({
      data: {
        userId,
        objectKey: key,
        originalName: metadata.originalName,
        mimeType: metadata.mimeType,
        size: metadata.size,
      },
    });

    const url = `${this.publicUrl}/${key}`;
    return { id: media.id, url, key };
  }

  async abortMultipartUpload(uploadId: string, key: string) {
    const command = new AbortMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
    });
    await this.s3.send(command);
    return { success: true };
  }

  async deleteMediaFile(userId: string, fileId: string) {
    const media = await this.prisma.mediaFile.findUnique({ where: { id: fileId } });
    if (!media) throw new NotFoundException('File not found');
    if (media.userId !== userId) throw new ForbiddenException('Not owner of file');

    await this.s3.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: media.objectKey,
    }));

    await this.prisma.mediaFile.delete({ where: { id: fileId } });
    return { success: true };
  }

  async getPublicMediaUrl(objectPath: string) {
    return { url: `${this.publicUrl}/${objectPath}` };
  }
}
