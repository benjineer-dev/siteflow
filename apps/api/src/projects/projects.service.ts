import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
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
    ownerId: string,
    query: ProjectQueryDto,
  ): Promise<ProjectListResponseDto> {
    const page = query.page;
    const limit = query.limit;
    const search = query.search?.trim();

    const where: Prisma.ProjectWhereInput = {
      ownerId,
      ...(search
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
        : {}),
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
    ownerId: string,
    projectId: string,
  ): Promise<ProjectResponseDto> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId,
      },
      select: projectSelect,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(
    ownerId: string,
    projectId: string,
    dto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    await this.assertOwnedProject(ownerId, projectId);

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
              description: this.normalizeDescription(dto.description),
            }
          : {}),
      },
      select: projectSelect,
    });
  }

  async remove(
    ownerId: string,
    projectId: string,
  ): Promise<void> {
    const result = await this.prisma.project.deleteMany({
      where: {
        id: projectId,
        ownerId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Project not found');
    }
  }

  async assertOwnedProject(
  ownerId: string,
  projectId: string,
): Promise<void> {
  const project = await this.prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId,
    },
    select: {
      id: true,
    },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
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