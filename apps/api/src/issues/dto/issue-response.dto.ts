import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IssuePriority,
  IssueStatus,
} from '../../generated/prisma/client';

export class IssueResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    enum: IssueStatus,
  })
  status: IssueStatus;

  @ApiProperty({
    enum: IssuePriority,
  })
  priority: IssuePriority;

  @ApiProperty()
  floorId: string;

  @ApiProperty()
  authorId: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  assigneeId: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  resolvedAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}