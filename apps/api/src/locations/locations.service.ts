import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { BuildingResponseDto } from './dto/building-response.dto';
import { CreateBuildingDto } from './dto/create-building.dto';
import { CreateFloorDto } from './dto/create-floor.dto';
import { FloorResponseDto } from './dto/floor-response.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';
import { UpdateFloorDto } from './dto/update-floor.dto';

const buildingSelect = {
  id: true,
  name: true,
  projectId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BuildingSelect;

const floorSelect = {
  id: true,
  level: true,
  name: true,
  buildingId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.FloorSelect;

@Injectable()
export class LocationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
  ) {}

  async createBuilding(
    ownerId: string,
    projectId: string,
    dto: CreateBuildingDto,
  ): Promise<BuildingResponseDto> {
    await this.projectsService.assertOwnedProject(
      ownerId,
      projectId,
    );

    try {
      return await this.prisma.building.create({
        data: {
          name: dto.name.trim(),
          projectId,
        },
        select: buildingSelect,
      });
    } catch (error) {
      this.handleUniqueConstraint(
        error,
        'A building with this name already exists',
      );
    }
  }

  async findBuildings(
    ownerId: string,
    projectId: string,
  ): Promise<BuildingResponseDto[]> {
    await this.projectsService.assertOwnedProject(
      ownerId,
      projectId,
    );

    return this.prisma.building.findMany({
      where: {
        projectId,
      },
      select: buildingSelect,
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findBuilding(
    ownerId: string,
    projectId: string,
    buildingId: string,
  ): Promise<BuildingResponseDto> {
    return this.getOwnedBuilding(
      ownerId,
      projectId,
      buildingId,
    );
  }

  async updateBuilding(
    ownerId: string,
    projectId: string,
    buildingId: string,
    dto: UpdateBuildingDto,
  ): Promise<BuildingResponseDto> {
    await this.getOwnedBuilding(
      ownerId,
      projectId,
      buildingId,
    );

    try {
      return await this.prisma.building.update({
        where: {
          id: buildingId,
        },
        data: {
          ...(dto.name !== undefined
            ? {
                name: dto.name.trim(),
              }
            : {}),
        },
        select: buildingSelect,
      });
    } catch (error) {
      this.handleUniqueConstraint(
        error,
        'A building with this name already exists',
      );
    }
  }

  async removeBuilding(
    ownerId: string,
    projectId: string,
    buildingId: string,
  ): Promise<void> {
    await this.getOwnedBuilding(
      ownerId,
      projectId,
      buildingId,
    );

    await this.prisma.building.delete({
      where: {
        id: buildingId,
      },
    });
  }

  async createFloor(
    ownerId: string,
    projectId: string,
    buildingId: string,
    dto: CreateFloorDto,
  ): Promise<FloorResponseDto> {
    await this.getOwnedBuilding(
      ownerId,
      projectId,
      buildingId,
    );

    try {
      return await this.prisma.floor.create({
        data: {
          level: dto.level,
          name: this.normalizeOptionalName(dto.name),
          buildingId,
        },
        select: floorSelect,
      });
    } catch (error) {
      this.handleUniqueConstraint(
        error,
        'A floor with this level already exists',
      );
    }
  }

  async findFloors(
    ownerId: string,
    projectId: string,
    buildingId: string,
  ): Promise<FloorResponseDto[]> {
    await this.getOwnedBuilding(
      ownerId,
      projectId,
      buildingId,
    );

    return this.prisma.floor.findMany({
      where: {
        buildingId,
      },
      select: floorSelect,
      orderBy: {
        level: 'asc',
      },
    });
  }

  async updateFloor(
    ownerId: string,
    projectId: string,
    buildingId: string,
    floorId: string,
    dto: UpdateFloorDto,
  ): Promise<FloorResponseDto> {
    await this.getOwnedFloor(
      ownerId,
      projectId,
      buildingId,
      floorId,
    );

    try {
      return await this.prisma.floor.update({
        where: {
          id: floorId,
        },
        data: {
          ...(dto.level !== undefined
            ? {
                level: dto.level,
              }
            : {}),
          ...(dto.name !== undefined
            ? {
                name: this.normalizeOptionalName(dto.name),
              }
            : {}),
        },
        select: floorSelect,
      });
    } catch (error) {
      this.handleUniqueConstraint(
        error,
        'A floor with this level already exists',
      );
    }
  }

  async removeFloor(
    ownerId: string,
    projectId: string,
    buildingId: string,
    floorId: string,
  ): Promise<void> {
    await this.getOwnedFloor(
      ownerId,
      projectId,
      buildingId,
      floorId,
    );

    await this.prisma.floor.delete({
      where: {
        id: floorId,
      },
    });
  }

  private async getOwnedBuilding(
    ownerId: string,
    projectId: string,
    buildingId: string,
  ): Promise<BuildingResponseDto> {
    const building = await this.prisma.building.findFirst({
      where: {
        id: buildingId,
        projectId,
        project: {
          ownerId,
        },
      },
      select: buildingSelect,
    });

    if (!building) {
      throw new NotFoundException('Building not found');
    }

    return building;
  }

  private async getOwnedFloor(
    ownerId: string,
    projectId: string,
    buildingId: string,
    floorId: string,
  ): Promise<FloorResponseDto> {
    const floor = await this.prisma.floor.findFirst({
      where: {
        id: floorId,
        buildingId,
        building: {
          projectId,
          project: {
            ownerId,
          },
        },
      },
      select: floorSelect,
    });

    if (!floor) {
      throw new NotFoundException('Floor not found');
    }

    return floor;
  }

  private normalizeOptionalName(
    name?: string,
  ): string | null | undefined {
    if (name === undefined) {
      return undefined;
    }

    const normalizedName = name.trim();

    return normalizedName.length > 0
      ? normalizedName
      : null;
  }

  private handleUniqueConstraint(
    error: unknown,
    message: string,
  ): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(message);
    }

    throw error;
  }
  async assertOwnedFloor(
  ownerId: string,
  projectId: string,
  floorId: string,
): Promise<void> {
  const floor = await this.prisma.floor.findFirst({
    where: {
      id: floorId,
      building: {
        projectId,
        project: {
          ownerId,
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (!floor) {
    throw new NotFoundException('Floor not found');
  }
}
}