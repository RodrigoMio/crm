import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadActivitiesController } from './lead-activities.controller';
import { LeadActivitiesService } from './lead-activities.service';
import { LeadOcorrencia } from '../lead-ocorrencias/entities/lead-ocorrencia.entity';
import { LeadsModule } from '../leads/leads.module';

@Module({
  imports: [TypeOrmModule.forFeature([LeadOcorrencia]), LeadsModule],
  controllers: [LeadActivitiesController],
  providers: [LeadActivitiesService],
  exports: [LeadActivitiesService],
})
export class LeadActivitiesModule {}




