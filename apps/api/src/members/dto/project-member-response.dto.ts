import { ApiProperty } from '@nestjs/swagger';
import { ProjectRole } from '../../generated/prisma/client';

export class ProjectMemberUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;
}

export class ProjectMemberResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({
    enum: ProjectRole,
  })
  role: ProjectRole;

  @ApiProperty({
    type: ProjectMemberUserDto,
  })
  user: ProjectMemberUserDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}