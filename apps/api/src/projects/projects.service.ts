import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ProjectRole,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectListResponseDto } from './dto/project-list-response.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const projectSelect = {
  id: true,
  name: true,
  description: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectSelect;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  create(
    ownerId: string,
    dto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.prisma.project.create({
      data: {
        name: dto.name.trim(),
        description: this.normalizeDescription(dto.description),
        ownerId,
      },
      select: projectSelect,
    });
  }

  async findAll(
    userId: string,
    query: ProjectQueryDto,
  ): Promise<ProjectListResponseDto> {
    const page = query.page;
    const limit = query.limit;
    const search = query.search?.trim();

    const accessWhere: Prisma.ProjectWhereInput = {
      OR: [
        {
          ownerId: userId,
        },
        {
          members: {
            some: {
              userId,
            },
          },
        },
      ],
    };

    const searchWhere: Prisma.ProjectWhereInput | undefined =
      search
        ? {
            OR: [
              {
                name: {
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
        : undefined;

    const where: Prisma.ProjectWhereInput = {
      AND: [
        accessWhere,
        ...(searchWhere ? [searchWhere] : []),
      ],
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.project.count({
        where,
      }),
      this.prisma.project.findMany({
        where,
        select: projectSelect,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(
    userId: string,
    projectId: string,
  ): Promise<ProjectResponseDto> {
    await this.assertProjectAccess(userId, projectId);

    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
      select: projectSelect,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(
    userId: string,
    projectId: string,
    dto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    await this.assertProjectOwner(userId, projectId);

    return this.prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        ...(dto.name !== undefined
          ? {
              name: dto.name.trim(),
            }
          : {}),
        ...(dto.description !== undefined
          ? {
              description: this.normalizeDescription(
                dto.description,
              ),
            }
          : {}),
      },
      select: projectSelect,
    });
  }

  async remove(
    userId: string,
    projectId: string,
  ): Promise<void> {
    await this.assertProjectOwner(userId, projectId);

    await this.prisma.project.delete({
      where: {
        id: projectId,
      },
    });
  }

  async getAccessRole(
    userId: string,
    projectId: string,
  ): Promise<ProjectRole> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          {
            ownerId: userId,
          },
          {
            members: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      select: {
        ownerId: true,
        members: {
          where: {
            userId,
          },
          select: {
            role: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.ownerId === userId) {
      return ProjectRole.OWNER;
    }

    const membership = project.members[0];

    if (!membership) {
      throw new NotFoundException('Project not found');
    }

    return membership.role;
  }

  async assertProjectAccess(
    userId: string,
    projectId: string,
  ): Promise<ProjectRole> {
    return this.getAccessRole(userId, projectId);
  }

  async assertProjectOwner(
    userId: string,
    projectId: string,
  ): Promise<void> {
    const role = await this.getAccessRole(
      userId,
      projectId,
    );

    if (role !== ProjectRole.OWNER) {
      throw new ForbiddenException(
        'Only the project owner can perform this action',
      );
    }
  }

  async assertCanManageIssues(
    userId: string,
    projectId: string,
  ): Promise<void> {
    const role = await this.getAccessRole(
      userId,
      projectId,
    );

    if (
      role !== ProjectRole.OWNER &&
      role !== ProjectRole.ENGINEER
    ) {
      throw new ForbiddenException(
        'You cannot manage issues in this project',
      );
    }
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