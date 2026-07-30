import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
  })
  accessToken!: string;

  @ApiProperty({
    type: UserResponseDto,
  })
  user!: UserResponseDto;
}