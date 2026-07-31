import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectsModule } from '../projects/projects.module';
import { BuildingsController } from './buildings.controller';
import { FloorsController } from './floors.controller';
import { LocationsService } from './locations.service';

@Module({
  imports: [
    PrismaModule,
    ProjectsModule,
  ],
  controllers: [
    BuildingsController,
    FloorsController,
  ],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}