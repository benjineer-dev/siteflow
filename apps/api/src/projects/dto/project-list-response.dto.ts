import { ApiProperty } from '@nestjs/swagger';
import { ProjectResponseDto } from './project-response.dto';

export class ProjectListMetaDto {
  @ApiProperty()
    page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}

export class ProjectListResponseDto {
  @ApiProperty({
    type: ProjectResponseDto,
    isArray: true,
  })
  items!: ProjectResponseDto[];

  @ApiProperty({
    type: ProjectListMetaDto,
  })
  meta!: ProjectListMetaDto;
}