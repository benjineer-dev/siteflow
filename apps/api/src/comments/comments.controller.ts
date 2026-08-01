import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { CommentResponseDto } from './dto/comment-response.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentsService } from './comments.service';

@ApiTags('comments')
@ApiBearerAuth('access-token')
@Controller(
  'projects/:projectId/issues/:issueId/comments',
)
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Add a comment to an issue',
  })
  @ApiCreatedResponse({
    type: CommentResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Issue not found',
  })
  create(
    @CurrentUser() user: UserResponseDto,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('issueId', ParseUUIDPipe) issueId: string,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.commentsService.create(
      user.id,
      projectId,
      issueId,
      dto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get issue comments',
  })
  @ApiOkResponse({
    type: CommentResponseDto,
    isArray: true,
  })
  findAll(
    @CurrentUser() user: UserResponseDto,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('issueId', ParseUUIDPipe) issueId: string,
  ): Promise<CommentResponseDto[]> {
    return this.commentsService.findAll(
      user.id,
      projectId,
      issueId,
    );
  }

  @Delete(':commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a comment created by the current user',
  })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({
    description: 'Comment not found',
  })
  async remove(
    @CurrentUser() user: UserResponseDto,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('issueId', ParseUUIDPipe) issueId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
  ): Promise<void> {
    await this.commentsService.remove(
      user.id,
      projectId,
      issueId,
      commentId,
    );
  }
}