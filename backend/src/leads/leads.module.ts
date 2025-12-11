import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { LeadsImportService } from './leads-import.service';
import { Lead } from './entities/lead.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lead, User])],
  controllers: [LeadsController],
  providers: [LeadsService, LeadsImportService],
})
export class LeadsModule {}




