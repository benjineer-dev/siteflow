import {
  Injectable,
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
  ) {}

  async create(
    ownerId: string,
    projectId: string,
    dto: CreateIssueDto,
  ): Promise<IssueResponseDto> {
    await this.projectsService.assertOwnedProject(
      ownerId,
      projectId,
    );

    await this.locationsService.assertOwnedFloor(
      ownerId,
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
        authorId: ownerId,
        ...(dto.priority !== undefined
          ? { priority: dto.priority }
          : {}),
      },
      select: issueSelect,
    });
  }

  async findAll(
    ownerId: string,
    projectId: string,
    query: IssueQueryDto,
  ): Promise<IssueListResponseDto> {
    await this.projectsService.assertOwnedProject(
      ownerId,
      projectId,
    );

    const search = query.search?.trim();

    const where: Prisma.IssueWhereInput = {
      floor: {
        building: {
          projectId,
          project: {
            ownerId,
          },
        },
      },
      ...(query.status !== undefined
        ? { status: query.status }
        : {}),
      ...(query.priority !== undefined
        ? { priority: query.priority }
        : {}),
      ...(query.floorId !== undefined
        ? { floorId: query.floorId }
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
    ownerId: string,
    projectId: string,
    issueId: string,
  ): Promise<IssueResponseDto> {
    return this.getOwnedIssue(
      ownerId,
      projectId,
      issueId,
    );
  }

  async update(
    ownerId: string,
    projectId: string,
    issueId: string,
    dto: UpdateIssueDto,
  ): Promise<IssueResponseDto> {
    await this.getOwnedIssue(
      ownerId,
      projectId,
      issueId,
    );

    if (dto.floorId !== undefined) {
      await this.locationsService.assertOwnedFloor(
        ownerId,
        projectId,
        dto.floorId,
      );
    }

    const resolvedAt =
      dto.status === IssueStatus.RESOLVED ||
      dto.status === IssueStatus.CLOSED
        ? new Date()
        : dto.status !== undefined
          ? null
          : undefined;

    return this.prisma.issue.update({
      where: {
        id: issueId,
      },
      data: {
        ...(dto.title !== undefined
          ? { title: dto.title.trim() }
          : {}),
        ...(dto.description !== undefined
          ? {
              description: this.normalizeDescription(
                dto.description,
              ),
            }
          : {}),
        ...(dto.priority !== undefined
          ? { priority: dto.priority }
          : {}),
        ...(dto.status !== undefined
          ? { status: dto.status }
          : {}),
        ...(dto.floorId !== undefined
          ? { floorId: dto.floorId }
          : {}),
        ...(resolvedAt !== undefined
          ? { resolvedAt }
          : {}),
      },
      select: issueSelect,
    });
  }

  async remove(
    ownerId: string,
    projectId: string,
    issueId: string,
  ): Promise<void> {
    await this.getOwnedIssue(
      ownerId,
      projectId,
      issueId,
    );

    await this.prisma.issue.delete({
      where: {
        id: issueId,
      },
    });
  }

  private async getOwnedIssue(
    ownerId: string,
    projectId: string,
    issueId: string,
  ): Promise<IssueResponseDto> {
    const issue = await this.prisma.issue.findFirst({
      where: {
        id: issueId,
        floor: {
          building: {
            projectId,
            project: {
              ownerId,
            },
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

  private normalizeDescription(
    description?: string,
  ): string | null | undefined {
    if (description === undefined) {
      return undefined;
    }

    const normalized = description.trim();

    return normalized.length > 0 ? normalized : null;
  }
}