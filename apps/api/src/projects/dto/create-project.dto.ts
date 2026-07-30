import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
        example: 'Residential Complex North',
        minLength: 2,
        maxLength: 120,
    })
    @IsString()
    @MinLength(2)
    @MaxLength(120)
    name!: string;

  @ApiPropertyOptional({
    example: 'Construction issue tracking for the north building.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}