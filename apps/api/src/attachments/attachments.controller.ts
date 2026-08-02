import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { AttachmentsService } from './attachments.service';
import { AttachmentResponseDto } from './dto/attachment-response.dto';

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

@ApiTags('attachments')
@ApiBearerAuth('access-token')
@Controller(
  'projects/:projectId/issues/:issueId/attachments',
)
export class AttachmentsController {
  constructor(
    private readonly attachmentsService:
      AttachmentsService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        files: 1,
        fileSize: MAX_ATTACHMENT_SIZE,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload an issue attachment',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiCreatedResponse({
    type: AttachmentResponseDto,
  })
  upload(
    @CurrentUser() user: UserResponseDto,
    @Param('projectId', ParseUUIDPipe)
    projectId: string,
    @Param('issueId', ParseUUIDPipe)
    issueId: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType:
            /^(image\/jpeg|image\/png|image\/webp|application\/pdf)$/,
        })
        .addMaxSizeValidator({
          maxSize: MAX_ATTACHMENT_SIZE,
        })
        .build({
          errorHttpStatusCode:
            HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
  ): Promise<AttachmentResponseDto> {
    return this.attachmentsService.upload(
      user.id,
      projectId,
      issueId,
      file,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get issue attachments',
  })
  @ApiOkResponse({
    type: AttachmentResponseDto,
    isArray: true,
  })
  findAll(
    @CurrentUser() user: UserResponseDto,
    @Param('projectId', ParseUUIDPipe)
    projectId: string,
    @Param('issueId', ParseUUIDPipe)
    issueId: string,
  ): Promise<AttachmentResponseDto[]> {
    return this.attachmentsService.findAll(
      user.id,
      projectId,
      issueId,
    );
  }

  @Get(':attachmentId/download')
  @ApiOperation({
    summary: 'Download an issue attachment',
  })
  @ApiOkResponse({
    description: 'Attachment file stream',
  })
  @ApiNotFoundResponse({
    description: 'Attachment not found',
  })
  async download(
    @CurrentUser() user: UserResponseDto,
    @Param('projectId', ParseUUIDPipe)
    projectId: string,
    @Param('issueId', ParseUUIDPipe)
    issueId: string,
    @Param('attachmentId', ParseUUIDPipe)
    attachmentId: string,
  ): Promise<StreamableFile> {
    const attachment =
      await this.attachmentsService.download(
        user.id,
        projectId,
        issueId,
        attachmentId,
      );

    return new StreamableFile(attachment.stream, {
      type: attachment.mimeType,
      length: attachment.size,
      disposition: this.createContentDisposition(
        attachment.originalName,
      ),
    });
  }

  @Delete(':attachmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete an issue attachment',
  })
  @ApiNoContentResponse()
  async remove(
    @CurrentUser() user: UserResponseDto,
    @Param('projectId', ParseUUIDPipe)
    projectId: string,
    @Param('issueId', ParseUUIDPipe)
    issueId: string,
    @Param('attachmentId', ParseUUIDPipe)
    attachmentId: string,
  ): Promise<void> {
    await this.attachmentsService.remove(
      user.id,
      projectId,
      issueId,
      attachmentId,
    );
  }

  private createContentDisposition(
    originalName: string,
  ): string {
    const fallbackName = originalName
      .replace(/[\r\n"\\]/g, '_')
      .replace(/[^\x20-\x7e]/g, '_');

    const encodedName =
      encodeURIComponent(originalName);

    return (
      `attachment; filename="${fallbackName}"; ` +
      `filename*=UTF-8''${encodedName}`
    );
  }
}