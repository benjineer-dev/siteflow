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
import { CreateIssueDto } from './dto/create-issue.dto';
import { IssueListResponseDto } from './dto/issue-list-response.dto';
import { IssueQueryDto } from './dto/issue-query.dto';
import { IssueResponseDto } from './dto/issue-response.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { IssuesService } from './issues.service';
import { AssignIssueDto } from './dto/assign-issue.dto';

@ApiTags('issues')
@ApiBearerAuth('access-token')
@Controller('projects/:projectId/issues')
export class IssuesController {
  constructor(
    private readonly issuesService: IssuesService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create an issue',
  })
  @ApiCreatedResponse({
    type: IssueResponseDto,
  })
  create(
    @CurrentUser() user: UserResponseDto,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateIssueDto,
  ): Promise<IssueResponseDto> {
    return this.issuesService.create(
      user.id,
      projectId,
      dto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get issues in a project',
  })
  @ApiOkResponse({
    type: IssueListResponseDto,
  })
  findAll(
    @CurrentUser() user: UserResponseDto,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: IssueQueryDto,
  ): Promise<IssueListResponseDto> {
    return this.issuesService.findAll(
      user.id,
      projectId,
      query,
    );
  }

  @Get(':issueId')
  @ApiOperation({
    summary: 'Get an issue',
  })
  @ApiOkResponse({
    type: IssueResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Issue not found',
  })
  findOne(
    @CurrentUser() user: UserResponseDto,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('issueId', ParseUUIDPipe) issueId: string,
  ): Promise<IssueResponseDto> {
    return this.issuesService.findOne(
      user.id,
      projectId,
      issueId,
    );
  }

  @Patch(':issueId')
  @ApiOperation({
    summary: 'Update an issue',
  })
  @ApiOkResponse({
    type: IssueResponseDto,
  })
  update(
    @CurrentUser() user: UserResponseDto,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('issueId', ParseUUIDPipe) issueId: string,
    @Body() dto: UpdateIssueDto,
  ): Promise<IssueResponseDto> {
    return this.issuesService.update(
      user.id,
      projectId,
      issueId,
      dto,
    );
  }

  @Delete(':issueId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete an issue',
  })
  @ApiNoContentResponse()
  async remove(
    @CurrentUser() user: UserResponseDto,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('issueId', ParseUUIDPipe) issueId: string,
  ): Promise<void> {
    await this.issuesService.remove(
      user.id,
      projectId,
      issueId,
    );
  }
  @Patch(':issueId/assignee')
@ApiOperation({
  summary: 'Assign or unassign an issue',
})
@ApiOkResponse({
  type: IssueResponseDto,
})
@ApiNotFoundResponse({
  description: 'Issue or project member not found',
})
assign(
  @CurrentUser() user: UserResponseDto,
  @Param('projectId', ParseUUIDPipe) projectId: string,
  @Param('issueId', ParseUUIDPipe) issueId: string,
  @Body() dto: AssignIssueDto,
): Promise<IssueResponseDto> {
  return this.issuesService.assign(
    user.id,
    projectId,
    issueId,
    dto,
  );
}
}