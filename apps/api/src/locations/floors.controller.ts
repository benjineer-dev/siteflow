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
import { CreateFloorDto } from './dto/create-floor.dto';
import { FloorResponseDto } from './dto/floor-response.dto';
import { UpdateFloorDto } from './dto/update-floor.dto';
import { LocationsService } from './locations.service';

@ApiTags('floors')
@ApiBearerAuth('access-token')
@Controller(
  'projects/:projectId/buildings/:buildingId/floors',
)
export class FloorsController {
  constructor(
    private readonly locationsService: LocationsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a floor in a building',
  })
  @ApiCreatedResponse({
    type: FloorResponseDto,
  })
  @ApiConflictResponse({
    description: 'A floor with this level already exists',
  })
  create(
    @CurrentUser() user: UserResponseDto,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
    @Body() dto: CreateFloorDto,
  ): Promise<FloorResponseDto> {
    return this.locationsService.createFloor(
      user.id,
      projectId,
      buildingId,
      dto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get floors in a building',
  })
  @ApiOkResponse({
    type: FloorResponseDto,
    isArray: true,
  })
  findAll(
    @CurrentUser() user: UserResponseDto,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
  ): Promise<FloorResponseDto[]> {
    return this.locationsService.findFloors(
      user.id,
      projectId,
      buildingId,
    );
  }

  @Patch(':floorId')
  @ApiOperation({
    summary: 'Update a floor',
  })
  @ApiOkResponse({
    type: FloorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Floor not found',
  })
  update(
    @CurrentUser() user: UserResponseDto,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
    @Param('floorId', ParseUUIDPipe) floorId: string,
    @Body() dto: UpdateFloorDto,
  ): Promise<FloorResponseDto> {
    return this.locationsService.updateFloor(
      user.id,
      projectId,
      buildingId,
      floorId,
      dto,
    );
  }

  @Delete(':floorId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a floor',
  })
  @ApiNoContentResponse()
  async remove(
    @CurrentUser() user: UserResponseDto,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
    @Param('floorId', ParseUUIDPipe) floorId: string,
  ): Promise<void> {
    await this.locationsService.removeFloor(
      user.id,
      projectId,
      buildingId,
      floorId,
    );
  }
}