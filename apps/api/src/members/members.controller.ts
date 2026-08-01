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
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { ProjectMemberResponseDto } from './dto/project-member-response.dto';
import { UpdateProjectMemberDto } from './dto/update-project-member.dto';
import { MembersService } from './members.service';

@ApiTags('project members')
@ApiBearerAuth('access-token')
@Controller('projects/:projectId/members')
export class MembersController {
  constructor(
    private readonly membersService: MembersService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Add a registered user to a project',
  })
  @ApiCreatedResponse({
    type: ProjectMemberResponseDto,
  })
  @ApiConflictResponse({
    description: 'The user is already a project member',
  })
  add(
    @CurrentUser() user: UserResponseDto,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: AddProjectMemberDto,
  ): Promise<ProjectMemberResponseDto> {
    return this.membersService.add(
      user.id,
      projectId,
      dto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get project members',
  })
  @ApiOkResponse({
    type: ProjectMemberResponseDto,
    isArray: true,
  })
  findAll(
    @CurrentUser() user: UserResponseDto,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<ProjectMemberResponseDto[]> {
    return this.membersService.findAll(
      user.id,
      projectId,
    );
  }

  @Patch(':memberId')
  update(
    @CurrentUser() user: UserResponseDto,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: UpdateProjectMemberDto,
  ): Promise<ProjectMemberResponseDto> {
    return this.membersService.update(
      user.id,
      projectId,
      memberId,
      dto,
    );
  }

  @Delete(':memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(
    @CurrentUser() user: UserResponseDto,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ): Promise<void> {
    await this.membersService.remove(
      user.id,
      projectId,
      memberId,
    );
  }
}