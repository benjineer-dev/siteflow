import { ApiProperty } from '@nestjs/swagger';
import { IssueResponseDto } from './issue-response.dto';

export class IssueListMetaDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;
}

export class IssueListResponseDto {
  @ApiProperty({
    type: IssueResponseDto,
    isArray: true,
  })
  items: IssueResponseDto[];

  @ApiProperty({
    type: IssueListMetaDto,
  })
  meta: IssueListMetaDto;
}