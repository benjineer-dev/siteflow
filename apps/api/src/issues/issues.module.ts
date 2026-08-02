import { Module } from '@nestjs/common';
import { LocationsModule } from '../locations/locations.module';
import { MembersModule } from '../members/members.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectsModule } from '../projects/projects.module';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';
import { FileStorageModule } from 'src/file-storage/file-storage.module';

@Module({
  imports: [
    PrismaModule,
    ProjectsModule,
    LocationsModule,
    MembersModule,
    FileStorageModule
  ],
  controllers: [IssuesController],
  providers: [IssuesService],
  exports: [IssuesService],
})
export class IssuesModule {}