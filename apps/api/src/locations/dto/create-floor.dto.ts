import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateFloorDto {
  @ApiProperty({
    example: 27,
    minimum: -20,
    maximum: 300,
  })
  @IsInt()
  @Min(-20)
  @Max(300)
  level!: number;

  @ApiPropertyOptional({
    example: 'Technical floor',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}