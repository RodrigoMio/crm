import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { FilterAppointmentsDto } from './dto/filter-appointments.dto';
import { CompleteAppointmentDto } from './dto/complete-appointment.dto';
import { Lead } from '../leads/entities/lead.entity';
import { User } from '../users/entities/user.entity';
import { LeadsService } from '../leads/leads.service';
import { Occurrence } from '../occurrences/entities/occurrence.entity';
export declare class AppointmentsService {
    private appointmentsRepository;
    private leadsRepository;
    private occurrencesRepository;
    private leadsService;
    constructor(appointmentsRepository: Repository<Appointment>, leadsRepository: Repository<Lead>, occurrencesRepository: Repository<Occurrence>, leadsService: LeadsService);
    private normalizeId;
    private validateDate;
    findScheduledByLead(leadId: number, currentUser: User): Promise<Appointment | null>;
    findAllByLead(leadId: number, currentUser: User): Promise<Appointment[]>;
    findOne(id: number, currentUser: User): Promise<Appointment>;
    create(leadId: number, createAppointmentDto: CreateAppointmentDto, currentUser: User): Promise<Appointment>;
    reschedule(id: number, rescheduleDto: RescheduleAppointmentDto, currentUser: User): Promise<Appointment>;
    cancel(id: number, currentUser: User): Promise<Appointment>;
    complete(id: number, completeDto: CompleteAppointmentDto, currentUser: User): Promise<Appointment>;
    markNoShow(id: number, currentUser: User): Promise<Appointment>;
    findAll(filterDto: FilterAppointmentsDto, currentUser: User): Promise<Appointment[]>;
    move(id: number, newDate: Date, currentUser: User): Promise<Appointment>;
}
