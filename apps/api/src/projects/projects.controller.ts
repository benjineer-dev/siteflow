import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
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
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectListResponseDto } from './dto/project-list-response.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth('access-token')
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a project',
  })
  @ApiCreatedResponse({
    type: ProjectResponseDto,
  })
  create(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get projects owned by the current user',
  })
  @ApiOkResponse({
    type: ProjectListResponseDto,
  })
  findAll(
    @CurrentUser() user: UserResponseDto,
    @Query() query: ProjectQueryDto,
  ): Promise<ProjectListResponseDto> {
    return this.projectsService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a project by ID',
  })
  @ApiOkResponse({
    type: ProjectResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Project not found',
  })
  findOne(
    @CurrentUser() user: UserResponseDto,
    @Param('id') projectId: string,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.findOne(user.id, projectId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a project',
  })
  @ApiOkResponse({
    type: ProjectResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Project not found',
  })
  update(
    @CurrentUser() user: UserResponseDto,
    @Param('id') projectId: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.update(
      user.id,
      projectId,
      dto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a project',
  })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({
    description: 'Project not found',
  })
  async remove(
    @CurrentUser() user: UserResponseDto,
    @Param('id') projectId: string,
  ): Promise<void> {
    await this.projectsService.remove(user.id, projectId);
  }
}