import { ApiProperty } from '@nestjs/swagger';

export class AttachmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({
    example: 'issue-photo.jpg',
  })
  originalName: string;

  @ApiProperty({
    example: 'image/jpeg',
  })
  mimeType: string;

  @ApiProperty({
    example: 245812,
  })
  size: number;

  @ApiProperty()
  issueId: string;

  @ApiProperty()
  uploaderId: string;

  @ApiProperty()
  createdAt: Date;
}