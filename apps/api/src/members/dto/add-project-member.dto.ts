import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  MaxLength,
} from 'class-validator';
import { ProjectRole } from '../../generated/prisma/client';

export class AddProjectMemberDto {
  @ApiProperty({
    example: 'contractor@example.com',
  })
  @IsEmail()
  @MaxLength(255)
  email: string;

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