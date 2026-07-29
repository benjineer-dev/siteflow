import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
  })
  @ApiCreatedResponse({
    type: AuthResponseDto,
  })
  @ApiConflictResponse({
    description: 'A user with this email already exists',
  })
  register(
    @Body() dto: RegisterDto,
  ): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log in with email and password',
  })
  @ApiOkResponse({
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email or password',
  })
  login(
    @Body() dto: LoginDto,
  ): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get the authenticated user',
  })
  @ApiOkResponse({
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or expired access token',
  })
  getMe(
    @CurrentUser() user: UserResponseDto,
  ): UserResponseDto {
    return user;
  }
}