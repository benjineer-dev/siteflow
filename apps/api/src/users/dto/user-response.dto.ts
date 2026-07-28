import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../generated/prisma/client';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({
    example: 'benjamin@example.com',
  })
  email: string;

  @ApiProperty({
    example: 'Benjamin',
  })
  name: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.ENGINEER,
  })
  role: UserRole;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}