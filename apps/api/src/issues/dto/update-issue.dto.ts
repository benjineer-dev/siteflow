import {
  ApiPropertyOptional,
  PartialType,
} from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { IssueStatus } from '../../generated/prisma/client';
import { CreateIssueDto } from './create-issue.dto';

export class UpdateIssueDto extends PartialType(
  CreateIssueDto,
) {
  @ApiPropertyOptional({
    enum: IssueStatus,
  })
  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;
}