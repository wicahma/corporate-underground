import {
  Controller, Post, Get, Delete, Param, Body, Request, Res,
  UseGuards, UseInterceptors, UploadedFiles, BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SessionTimeoutGuard } from '../auth/session-timeout.guard';

@Controller()
export class UploadController {
  constructor(private storage: StorageService) {}

  @UseGuards(JwtAuthGuard, SessionTimeoutGuard)
  @Post('uploads/initiate')
  async initiateMultipartUpload(
    @Request() req: { user: { sub: string } },
    @Body() body: { filename: string; contentType: string; partsCount: number },
  ) {
    if (!body.filename || !body.contentType) {
      throw new BadRequestException('Missing filename or contentType');
    }
    return this.storage.initiateMultipartUpload(req.user.sub, body.filename, body.contentType, body.partsCount || 1);
  }

  @UseGuards(JwtAuthGuard, SessionTimeoutGuard)
  @Post('uploads/:uploadId/parts')
  async getUploadPartUrl(
    @Param('uploadId') uploadId: string,
    @Body() body: { partNumber: number; key: string },
  ) {
    if (!body.partNumber || !body.key) {
      throw new BadRequestException('Missing partNumber or key');
    }
    return this.storage.getUploadPartUrl(uploadId, body.key, body.partNumber);
  }

  @UseGuards(JwtAuthGuard, SessionTimeoutGuard)
  @Get('uploads/:uploadId/status')
  async getUploadStatus(
    @Param('uploadId') uploadId: string,
    @Body() body: { key: string },
  ) {
    return this.storage.getUploadStatus(uploadId, body.key);
  }

  @UseGuards(JwtAuthGuard, SessionTimeoutGuard)
  @Post('uploads/:uploadId/complete')
  async completeMultipartUpload(
    @Request() req: { user: { sub: string } },
    @Param('uploadId') uploadId: string,
    @Body() body: { key: string; originalName: string; mimeType: string; size: number; parts: { ETag: string; PartNumber: number }[] },
  ) {
    return this.storage.completeMultipartUpload(req.user.sub, uploadId, body.key, body.parts, {
      originalName: body.originalName,
      mimeType: body.mimeType,
      size: body.size,
    });
  }

  @UseGuards(JwtAuthGuard, SessionTimeoutGuard)
  @Delete('uploads/:uploadId')
  async abortMultipartUpload(
    @Param('uploadId') uploadId: string,
    @Body() body: { key: string },
  ) {
    return this.storage.abortMultipartUpload(uploadId, body.key);
  }

  @UseGuards(JwtAuthGuard, SessionTimeoutGuard)
  @Post('uploads/images')
  @UseInterceptors(FilesInterceptor('files', 10, {
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        cb(new BadRequestException('Only images allowed'), false);
      } else {
        cb(null, true);
      }
    },
  }))
  async uploadImages(
    @Request() req: { user: { sub: string } },
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) throw new BadRequestException('No files uploaded');
    if (files.length > 10) throw new BadRequestException('Max 10 files allowed');

    return this.storage.uploadMultipleImages(req.user.sub, files);
  }

  @UseGuards(JwtAuthGuard, SessionTimeoutGuard)
  @Delete('files/:fileId')
  async deleteFile(
    @Request() req: { user: { sub: string } },
    @Param('fileId') fileId: string,
  ) {
    return this.storage.deleteMediaFile(req.user.sub, fileId);
  }

  @Get('public/media/*')
  async getPublicMedia(@Param() params: { '0': string }, @Res() res: Response) {
    const objectPath = params['0'];
    const result = await this.storage.getObjectStream(objectPath);
    if (!result) {
      throw new NotFoundException('Media not found');
    }

    res.setHeader('Content-Type', result.contentType);
    if (result.contentLength) {
      res.setHeader('Content-Length', result.contentLength);
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    result.stream.pipe(res);
  }
}
