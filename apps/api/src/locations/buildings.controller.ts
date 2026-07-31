import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { BuildingResponseDto } from './dto/building-response.dto';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';
import { LocationsService } from './locations.service';

@ApiTags('buildings')
@ApiBearerAuth('access-token')
@Controller('projects/:projectId/buildings')
export class BuildingsController {
  constructor(
    private readonly locationsService: LocationsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a building in a project',
  })
  @ApiCreatedResponse({
    type: BuildingResponseDto,
  })
  @ApiConflictResponse({
    description: 'A building with this name already exists',
  })
  create(
    @CurrentUser() user: UserResponseDto,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateBuildingDto,
  ): Promise<BuildingResponseDto> {
    return this.locationsService.createBuilding(
      user.id,
      projectId,
      dto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get buildings in a project',
  })
  @ApiOkResponse({
    type: BuildingResponseDto,
    isArray: true,
  })
  findAll(
    @CurrentUser() user: UserResponseDto,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<BuildingResponseDto[]> {
    return this.locationsService.findBuildings(
      user.id,
      projectId,
    );
  }

  @Get(':buildingId')
  @ApiOperation({
    summary: 'Get a building',
  })
  @ApiOkResponse({
    type: BuildingResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Building not found',
  })
  findOne(
    @CurrentUser() user: UserResponseDto,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
  ): Promise<BuildingResponseDto> {
    return this.locationsService.findBuilding(
      user.id,
      projectId,
      buildingId,
    );
  }

  @Patch(':buildingId')
  @ApiOperation({
    summary: 'Update a building',
  })
  @ApiOkResponse({
    type: BuildingResponseDto,
  })
  update(
    @CurrentUser() user: UserResponseDto,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
    @Body() dto: UpdateBuildingDto,
  ): Promise<BuildingResponseDto> {
    return this.locationsService.updateBuilding(
      user.id,
      projectId,
      buildingId,
      dto,
    );
  }

  @Delete(':buildingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a building and its floors',
  })
  @ApiNoContentResponse()
  async remove(
    @CurrentUser() user: UserResponseDto,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
  ): Promise<void> {
    await this.locationsService.removeBuilding(
      user.id,
      projectId,
      buildingId,
    );
  }
}