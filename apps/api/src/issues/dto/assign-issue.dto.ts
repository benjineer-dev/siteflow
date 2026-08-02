import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, ValidateIf } from 'class-validator';

export class AssignIssueDto {
  @ApiProperty({
        format: 'uuid',
        nullable: true,
        example: '1a4df4fd-7d82-4ff4-a9cd-13ef71e553c7',
        description: 'Set null to remove the current assignee',
    })
    @ValidateIf((_object, value) => value !== null)
    @IsUUID()
    assigneeId!: string | null;
}