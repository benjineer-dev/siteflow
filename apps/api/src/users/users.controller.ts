import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a user',
  })
  @ApiCreatedResponse({
    type: UserResponseDto,
  })
  @ApiConflictResponse({
    description: 'A user with this email already exists',
  })
  create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all users',
  })
  findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }
}