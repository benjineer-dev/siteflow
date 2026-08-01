import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    example: 'The issue has been inspected. Additional fastening is required.',
    maxLength: 3000,
  })
  @IsString()
  @MaxLength(3000)
  @Matches(/\S/, {
    message: 'content must contain non-whitespace characters',
  })
  content!: string;
}