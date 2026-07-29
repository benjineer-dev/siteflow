import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserResponseDto } from './dto/user-response.dto';

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

interface CreateUserData {
  email: string;
  name: string;
  passwordHash: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateUserData): Promise<UserResponseDto> {
    return this.prisma.user.create({
      data,
      select: publicUserSelect,
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });
  }

  findByEmailWithPassword(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        ...publicUserSelect,
        passwordHash: true,
      },
    });
  }

  findById(id: string): Promise<UserResponseDto | null> {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
      select: publicUserSelect,
    });
  }

  findAll(): Promise<UserResponseDto[]> {
    return this.prisma.user.findMany({
      select: publicUserSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}