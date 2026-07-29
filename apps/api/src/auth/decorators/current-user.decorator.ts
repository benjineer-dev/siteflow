import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { Request } from 'express';
import { UserResponseDto } from '../../users/dto/user-response.dto';

type AuthenticatedRequest = Request & {
  user: UserResponseDto;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UserResponseDto => {
    const request =
      context.switchToHttp().getRequest<AuthenticatedRequest>();

    return request.user;
  },
);