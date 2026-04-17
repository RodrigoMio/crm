import { AppointmentStatus } from '../entities/appointment.entity';
export declare class FilterAppointmentsDto {
    startDate?: string;
    endDate?: string;
    status?: AppointmentStatus;
    vendedor_id?: number;
    colaborador_id?: number;
}
