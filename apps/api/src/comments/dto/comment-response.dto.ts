import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../generated/prisma/client';

export class CommentAuthorDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({
    enum: UserRole,
  })
  role!: UserRole;
}

export class CommentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  issueId!: string;

  @ApiProperty()
  authorId!: string;

  @ApiProperty({
    type: CommentAuthorDto,
  })
  author!: CommentAuthorDto;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}