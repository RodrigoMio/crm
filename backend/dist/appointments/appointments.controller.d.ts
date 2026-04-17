import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { FilterAppointmentsDto } from './dto/filter-appointments.dto';
import { MoveAppointmentDto } from './dto/move-appointment.dto';
import { CompleteAppointmentDto } from './dto/complete-appointment.dto';
export declare class AppointmentsController {
    private readonly appointmentsService;
    constructor(appointmentsService: AppointmentsService);
    findScheduled(leadId: number, req: any): Promise<import("./entities/appointment.entity").Appointment>;
    findAll(leadId: number, req: any): Promise<import("./entities/appointment.entity").Appointment[]>;
    create(leadId: number, createAppointmentDto: CreateAppointmentDto, req: any): Promise<import("./entities/appointment.entity").Appointment>;
}
export declare class AppointmentsControllerById {
    private readonly appointmentsService;
    constructor(appointmentsService: AppointmentsService);
    findOne(id: number, req: any): Promise<import("./entities/appointment.entity").Appointment>;
    reschedule(id: number, rescheduleDto: RescheduleAppointmentDto, req: any): Promise<import("./entities/appointment.entity").Appointment>;
    cancel(id: number, req: any): Promise<import("./entities/appointment.entity").Appointment>;
    complete(id: number, completeDto: CompleteAppointmentDto, req: any): Promise<import("./entities/appointment.entity").Appointment>;
    markNoShow(id: number, req: any): Promise<import("./entities/appointment.entity").Appointment>;
    move(id: number, moveDto: MoveAppointmentDto, req: any): Promise<import("./entities/appointment.entity").Appointment>;
    findAll(filterDto: FilterAppointmentsDto, req: any): Promise<import("./entities/appointment.entity").Appointment[]>;
}
