import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

export class FloorResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    example: 27,
  })
  level!: number;

  @ApiPropertyOptional({
    nullable: true,
  })
  name!: string | null;

  @ApiProperty()
  buildingId!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}