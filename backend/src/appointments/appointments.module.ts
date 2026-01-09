import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController, AppointmentsControllerById } from './appointments.controller';
import { Appointment } from './entities/appointment.entity';
import { Lead } from '../leads/entities/lead.entity';
import { LeadsModule } from '../leads/leads.module';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Lead]), LeadsModule],
  controllers: [AppointmentsController, AppointmentsControllerById],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}

