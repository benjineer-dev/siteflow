import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { ProjectRole } from '../../generated/prisma/client';

export class UpdateProjectMemberDto {
  @ApiProperty({
    enum: [
      ProjectRole.ENGINEER,
      ProjectRole.CONTRACTOR,
    ],
  })
  @IsIn([
    ProjectRole.ENGINEER,
    ProjectRole.CONTRACTOR,
  ])
  role: ProjectRole;
}