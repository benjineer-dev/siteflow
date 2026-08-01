import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ProjectRole,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { ProjectMemberResponseDto } from './dto/project-member-response.dto';
import { UpdateProjectMemberDto } from './dto/update-project-member.dto';

const memberSelect = {
  id: true,
  projectId: true,
  userId: true,
  role: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectMemberSelect;

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
  ) {}

  async add(
    currentUserId: string,
    projectId: string,
    dto: AddProjectMemberDto,
  ): Promise<ProjectMemberResponseDto> {
    await this.projectsService.assertProjectOwner(
      currentUserId,
      projectId,
    );

    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException(
        'A registered user with this email was not found',
      );
    }

    if (user.id === currentUserId) {
      throw new ConflictException(
        'The project owner is already part of the project',
      );
    }

    try {
      return await this.prisma.projectMember.create({
        data: {
          projectId,
          userId: user.id,
          role: dto.role,
        },
        select: memberSelect,
      });
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This user is already a project member',
        );
      }

      throw error;
    }
  }

  async findAll(
    currentUserId: string,
    projectId: string,
  ): Promise<ProjectMemberResponseDto[]> {
    await this.projectsService.assertProjectAccess(
      currentUserId,
      projectId,
    );

    return this.prisma.projectMember.findMany({
      where: {
        projectId,
      },
      select: memberSelect,
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async update(
    currentUserId: string,
    projectId: string,
    memberId: string,
    dto: UpdateProjectMemberDto,
  ): Promise<ProjectMemberResponseDto> {
    await this.projectsService.assertProjectOwner(
      currentUserId,
      projectId,
    );

    const member = await this.prisma.projectMember.findFirst({
      where: {
        id: memberId,
        projectId,
      },
      select: {
        id: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Project member not found');
    }

    return this.prisma.projectMember.update({
      where: {
        id: memberId,
      },
      data: {
        role: dto.role,
      },
      select: memberSelect,
    });
  }

  async remove(
    currentUserId: string,
    projectId: string,
    memberId: string,
  ): Promise<void> {
    await this.projectsService.assertProjectOwner(
      currentUserId,
      projectId,
    );

    const result =
      await this.prisma.projectMember.deleteMany({
        where: {
          id: memberId,
          projectId,
        },
      });

    if (result.count === 0) {
      throw new NotFoundException('Project member not found');
    }
  }

  async assertProjectMember(
    projectId: string,
    userId: string,
  ): Promise<ProjectRole> {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
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
      throw new NotFoundException('Project member not found');
    }

    return membership.role;
  }
}