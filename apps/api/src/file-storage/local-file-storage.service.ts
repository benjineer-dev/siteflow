import {
  Injectable,
  OnModuleInit,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  access,
  mkdir,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { createReadStream, ReadStream } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Multer } from 'multer';

interface DetectedFileType {
  extension: string;
  mimeType: string;
}

export interface StoredFile {
  storedName: string;
  originalName: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class LocalFileStorageService implements OnModuleInit {
  private readonly uploadDirectory: string;

  constructor(configService: ConfigService) {
    const configuredDirectory =
      configService.get<string>(
        'UPLOAD_DIR',
        'storage/uploads',
      );

    this.uploadDirectory = resolve(
      process.cwd(),
      configuredDirectory,
    );
  }

  async onModuleInit(): Promise<void> {
    await mkdir(this.uploadDirectory, {
      recursive: true,
    });
  }

  async save(
    file: Express.Multer.File,
  ): Promise<StoredFile> {
    const detectedType = this.detectFileType(file.buffer);

    if (!detectedType) {
      throw new UnsupportedMediaTypeException(
        'Only JPEG, PNG, WebP and PDF files are allowed',
      );
    }

    const storedName =
      `${randomUUID()}.${detectedType.extension}`;

    const originalName = this.normalizeOriginalName(
      file.originalname,
      detectedType.extension,
    );

    await writeFile(
      this.resolveStoredFile(storedName),
      file.buffer,
      {
        flag: 'wx',
      },
    );

    return {
      storedName,
      originalName,
      mimeType: detectedType.mimeType,
      size: file.size,
    };
  }

  async open(storedName: string): Promise<ReadStream> {
    const filePath = this.resolveStoredFile(storedName);

    await access(filePath);

    return createReadStream(filePath);
  }

  async remove(storedName: string): Promise<void> {
    try {
      await unlink(this.resolveStoredFile(storedName));
    } catch (error) {
      if (this.isFileNotFoundError(error)) {
        return;
      }

      throw error;
    }
  }

  private resolveStoredFile(storedName: string): string {
    if (
      basename(storedName) !== storedName ||
      !/^[0-9a-f-]+\.(jpg|png|webp|pdf)$/i.test(
        storedName,
      )
    ) {
      throw new Error('Invalid stored filename');
    }

    return join(this.uploadDirectory, storedName);
  }

  private normalizeOriginalName(
    originalName: string,
    fallbackExtension: string,
  ): string {
    const normalized = basename(originalName)
      .replace(/[\r\n]/g, '')
      .trim()
      .slice(0, 255);

    return normalized.length > 0
      ? normalized
      : `attachment.${fallbackExtension}`;
  }

  private detectFileType(
    buffer: Buffer,
  ): DetectedFileType | null {
    if (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    ) {
      return {
        extension: 'jpg',
        mimeType: 'image/jpeg',
      };
    }

    const pngSignature = Buffer.from([
      0x89,
      0x50,
      0x4e,
      0x47,
      0x0d,
      0x0a,
      0x1a,
      0x0a,
    ]);

    if (
      buffer.length >= pngSignature.length &&
      buffer
        .subarray(0, pngSignature.length)
        .equals(pngSignature)
    ) {
      return {
        extension: 'png',
        mimeType: 'image/png',
      };
    }

    if (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') ===
        'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') ===
        'WEBP'
    ) {
      return {
        extension: 'webp',
        mimeType: 'image/webp',
      };
    }

    if (
      buffer.length >= 5 &&
      buffer.subarray(0, 5).toString('ascii') ===
        '%PDF-'
    ) {
      return {
        extension: 'pdf',
        mimeType: 'application/pdf',
      };
    }

    return null;
  }

  private isFileNotFoundError(
    error: unknown,
  ): error is NodeJS.ErrnoException {
    return (
      error instanceof Error &&
      'code' in error &&
      error.code === 'ENOENT'
    );
  }
}