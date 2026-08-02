import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  IssueStatus,
  Prisma,
} from '../generated/prisma/client';
import { LocationsService } from '../locations/locations.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { IssueListResponseDto } from './dto/issue-list-response.dto';
import { IssueQueryDto } from './dto/issue-query.dto';
import { IssueResponseDto } from './dto/issue-response.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { MembersService } from 'src/members/members.service';
import { AssignIssueDto } from './dto/assign-issue.dto';
import { LocalFileStorageService } from 'src/file-storage/local-file-storage.service';

const issueSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  floorId: true,
  authorId: true,
  assigneeId: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.IssueSelect;

@Injectable()
export class IssuesService {
  constructor(
  private readonly prisma: PrismaService,
  private readonly projectsService: ProjectsService,
  private readonly locationsService: LocationsService,
    private readonly membersService: MembersService,
  private readonly fileStorage: LocalFileStorageService,
) {}
private readonly logger = new Logger(
  IssuesService.name,
);
  async create(
    userId: string,
    projectId: string,
    dto: CreateIssueDto,
  ): Promise<IssueResponseDto> {
    await this.projectsService.assertCanManageIssues(
      userId,
      projectId,
    );

    await this.locationsService.assertAccessibleFloor(
      userId,
      projectId,
      dto.floorId,
    );

    return this.prisma.issue.create({
      data: {
        title: dto.title.trim(),
        description: this.normalizeDescription(
          dto.description,
        ),
        floorId: dto.floorId,
        authorId: userId,
        ...(dto.priority !== undefined
          ? {
              priority: dto.priority,
            }
          : {}),
      },
      select: issueSelect,
    });
  }

  async findAll(
    userId: string,
    projectId: string,
    query: IssueQueryDto,
  ): Promise<IssueListResponseDto> {
    await this.projectsService.assertProjectAccess(
      userId,
      projectId,
    );

    if (query.floorId !== undefined) {
      await this.locationsService.assertAccessibleFloor(
        userId,
        projectId,
        query.floorId,
      );
    }

    const search = query.search?.trim();

   const where: Prisma.IssueWhereInput = {
  floor: {
    building: {
      projectId,
    },
  },
  ...(query.status !== undefined
    ? {
        status: query.status,
      }
    : {}),
  ...(query.priority !== undefined
    ? {
        priority: query.priority,
      }
    : {}),
  ...(query.floorId !== undefined
    ? {
        floorId: query.floorId,
      }
    : {}),
  ...(query.assigneeId !== undefined
    ? {
        assigneeId: query.assigneeId,
      }
    : {}),
  ...(search
    ? {
        OR: [
          {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      }
    : {}),
};
    const [total, items] = await this.prisma.$transaction([
      this.prisma.issue.count({
        where,
      }),
      this.prisma.issue.findMany({
        where,
        select: issueSelect,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    return {
      items,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  findOne(
    userId: string,
    projectId: string,
    issueId: string,
  ): Promise<IssueResponseDto> {
    return this.assertAccessibleIssue(
      userId,
      projectId,
      issueId,
    );
  }

  async update(
    userId: string,
    projectId: string,
    issueId: string,
    dto: UpdateIssueDto,
  ): Promise<IssueResponseDto> {
    await this.projectsService.assertCanManageIssues(
      userId,
      projectId,
    );

    const issue = await this.getIssueInProject(
      projectId,
      issueId,
    );

    if (dto.floorId !== undefined) {
      await this.locationsService.assertAccessibleFloor(
        userId,
        projectId,
        dto.floorId,
      );
    }

    const resolvedAt = this.resolveCompletionDate(
      issue.resolvedAt,
      dto.status,
    );

    return this.prisma.issue.update({
      where: {
        id: issueId,
      },
      data: {
        ...(dto.title !== undefined
          ? {
              title: dto.title.trim(),
            }
          : {}),
        ...(dto.description !== undefined
          ? {
              description: this.normalizeDescription(
                dto.description,
              ),
            }
          : {}),
        ...(dto.priority !== undefined
          ? {
              priority: dto.priority,
            }
          : {}),
        ...(dto.status !== undefined
          ? {
              status: dto.status,
            }
          : {}),
        ...(dto.floorId !== undefined
          ? {
              floorId: dto.floorId,
            }
          : {}),
        ...(resolvedAt !== undefined
          ? {
              resolvedAt,
            }
          : {}),
      },
      select: issueSelect,
    });
  }
async assign(
  userId: string,
  projectId: string,
  issueId: string,
  dto: AssignIssueDto,
): Promise<IssueResponseDto> {
  await this.projectsService.assertCanManageIssues(
    userId,
    projectId,
  );

  await this.getIssueInProject(
    projectId,
    issueId,
  );

  if (dto.assigneeId !== null) {
    await this.membersService.assertProjectMember(
      projectId,
      dto.assigneeId,
    );
  }

  return this.prisma.issue.update({
    where: {
      id: issueId,
    },
    data: {
      assigneeId: dto.assigneeId,
    },
    select: issueSelect,
  });
}
 async remove(
  userId: string,
  projectId: string,
  issueId: string,
): Promise<void> {
  await this.projectsService.assertCanManageIssues(
    userId,
    projectId,
  );

  await this.getIssueInProject(
    projectId,
    issueId,
  );

  const attachments =
    await this.prisma.attachment.findMany({
      where: {
        issueId,
      },
      select: {
        storedName: true,
      },
    });

  await this.prisma.issue.delete({
    where: {
      id: issueId,
    },
  });

  const results = await Promise.allSettled(
    attachments.map((attachment) =>
      this.fileStorage.remove(
        attachment.storedName,
      ),
    ),
  );

  const failedCount = results.filter(
    (result) => result.status === 'rejected',
  ).length;

  if (failedCount > 0) {
    this.logger.warn(
      `Failed to remove ${failedCount} attachment files for issue ${issueId}`,
    );
  }
}

  async assertAccessibleIssue(
    userId: string,
    projectId: string,
    issueId: string,
  ): Promise<IssueResponseDto> {
    await this.projectsService.assertProjectAccess(
      userId,
      projectId,
    );

    return this.getIssueInProject(
      projectId,
      issueId,
    );
  }

  private async getIssueInProject(
    projectId: string,
    issueId: string,
  ): Promise<IssueResponseDto> {
    const issue = await this.prisma.issue.findFirst({
      where: {
        id: issueId,
        floor: {
          building: {
            projectId,
          },
        },
      },
      select: issueSelect,
    });

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    return issue;
  }

  private resolveCompletionDate(
    currentResolvedAt: Date | null,
    status?: IssueStatus,
  ): Date | null | undefined {
    if (status === undefined) {
      return undefined;
    }

    if (
      status === IssueStatus.RESOLVED ||
      status === IssueStatus.CLOSED
    ) {
      return currentResolvedAt ?? new Date();
    }

    return null;
  }

  private normalizeDescription(
    description?: string,
  ): string | null | undefined {
    if (description === undefined) {
      return undefined;
    }

    const normalized = description.trim();

    return normalized.length > 0
      ? normalized
      : null;
  }
}
