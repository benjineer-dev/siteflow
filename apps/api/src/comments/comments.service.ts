import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { IssuesService } from '../issues/issues.service';
import { PrismaService } from '../prisma/prisma.service';
import { CommentResponseDto } from './dto/comment-response.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

const commentSelect = {
  id: true,
  content: true,
  issueId: true,
  authorId: true,
  author: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.IssueCommentSelect;

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly issuesService: IssuesService,
  ) {}

  async create(
    userId: string,
    projectId: string,
    issueId: string,
    dto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    await this.issuesService.assertAccessibleIssue(
      userId,
      projectId,
      issueId,
    );

    return this.prisma.issueComment.create({
      data: {
        content: dto.content.trim(),
        issueId,
        authorId: userId,
      },
      select: commentSelect,
    });
  }

  async findAll(
    userId: string,
    projectId: string,
    issueId: string,
  ): Promise<CommentResponseDto[]> {
    await this.issuesService.assertAccessibleIssue(
      userId,
      projectId,
      issueId,
    );

    return this.prisma.issueComment.findMany({
      where: {
        issueId,
      },
      select: commentSelect,
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async remove(
    userId: string,
    projectId: string,
    issueId: string,
    commentId: string,
  ): Promise<void> {
    await this.issuesService.assertAccessibleIssue(
      userId,
      projectId,
      issueId,
    );

    const result = await this.prisma.issueComment.deleteMany({
      where: {
        id: commentId,
        issueId,
        authorId: userId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Comment not found');
    }
  }
}