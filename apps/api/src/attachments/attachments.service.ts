import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ReadStream } from 'node:fs';
import {
  Prisma,
  ProjectRole,
} from '../generated/prisma/client';
import { IssuesService } from '../issues/issues.service';
import { LocalFileStorageService } from '../file-storage/local-file-storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { AttachmentResponseDto } from './dto/attachment-response.dto';

const attachmentSelect = {
  id: true,
  originalName: true,
  mimeType: true,
  size: true,
  issueId: true,
  uploaderId: true,
  createdAt: true,
} satisfies Prisma.AttachmentSelect;

const attachmentFileSelect = {
  ...attachmentSelect,
  storedName: true,
} satisfies Prisma.AttachmentSelect;

interface AttachmentDownload {
  stream: ReadStream;
  originalName: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class AttachmentsService {
  private readonly logger = new Logger(
    AttachmentsService.name,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly issuesService: IssuesService,
    private readonly projectsService: ProjectsService,
    private readonly fileStorage: LocalFileStorageService,
  ) {}

  async upload(
    userId: string,
    projectId: string,
    issueId: string,
    file: Express.Multer.File,
  ): Promise<AttachmentResponseDto> {
    await this.issuesService.assertAccessibleIssue(
      userId,
      projectId,
      issueId,
    );

    const storedFile =
      await this.fileStorage.save(file);

    try {
      return await this.prisma.attachment.create({
        data: {
          originalName: storedFile.originalName,
          storedName: storedFile.storedName,
          mimeType: storedFile.mimeType,
          size: storedFile.size,
          issueId,
          uploaderId: userId,
        },
        select: attachmentSelect,
      });
    } catch (error) {
      await this.fileStorage.remove(
        storedFile.storedName,
      );

      throw error;
    }
  }

  async findAll(
    userId: string,
    projectId: string,
    issueId: string,
  ): Promise<AttachmentResponseDto[]> {
    await this.issuesService.assertAccessibleIssue(
      userId,
      projectId,
      issueId,
    );

    return this.prisma.attachment.findMany({
      where: {
        issueId,
      },
      select: attachmentSelect,
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async download(
    userId: string,
    projectId: string,
    issueId: string,
    attachmentId: string,
  ): Promise<AttachmentDownload> {
    await this.issuesService.assertAccessibleIssue(
      userId,
      projectId,
      issueId,
    );

    const attachment = await this.getAttachment(
      issueId,
      attachmentId,
    );

    let stream: ReadStream;

    try {
      stream = await this.fileStorage.open(
        attachment.storedName,
      );
    } catch {
      throw new NotFoundException(
        'Attachment file not found',
      );
    }

    return {
      stream,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size,
    };
  }

  async remove(
    userId: string,
    projectId: string,
    issueId: string,
    attachmentId: string,
  ): Promise<void> {
    const role =
      await this.projectsService.getAccessRole(
        userId,
        projectId,
      );

    await this.issuesService.assertAccessibleIssue(
      userId,
      projectId,
      issueId,
    );

    const attachment = await this.getAttachment(
      issueId,
      attachmentId,
    );

    const canDelete =
      attachment.uploaderId === userId ||
      role === ProjectRole.OWNER;

    if (!canDelete) {
      throw new ForbiddenException(
        'Only the uploader or project owner can delete this attachment',
      );
    }

    await this.prisma.attachment.delete({
      where: {
        id: attachmentId,
      },
    });

    try {
      await this.fileStorage.remove(
        attachment.storedName,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to remove stored file ${attachment.storedName}`,
      );
    }
  }

  private async getAttachment(
    issueId: string,
    attachmentId: string,
  ) {
    const attachment =
      await this.prisma.attachment.findFirst({
        where: {
          id: attachmentId,
          issueId,
        },
        select: attachmentFileSelect,
      });

    if (!attachment) {
      throw new NotFoundException(
        'Attachment not found',
      );
    }

    return attachment;
  }
}