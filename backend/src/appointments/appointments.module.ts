import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController, AppointmentsControllerById } from './appointments.controller';
import { Appointment } from './entities/appointment.entity';
import { Lead } from '../leads/entities/lead.entity';
import { Occurrence } from '../occurrences/entities/occurrence.entity';
import { LeadsModule } from '../leads/leads.module';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Lead, Occurrence]), LeadsModule],
  controllers: [AppointmentsController, AppointmentsControllerById],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}

