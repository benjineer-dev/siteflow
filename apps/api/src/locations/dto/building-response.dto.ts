import { ApiProperty } from '@nestjs/swagger';

export class BuildingResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    example: 'Tower A',
  })
  name!: string;

  @ApiProperty()
  projectId!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}