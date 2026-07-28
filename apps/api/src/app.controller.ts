import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getApi() {
    return {
      name: 'SiteFlow API',
      status: 'running',
    };
  }

  @Get('health/database')
  async checkDatabase() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      database: 'connected',
    };
  }
}