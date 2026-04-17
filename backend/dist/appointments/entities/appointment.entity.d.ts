import { Lead } from '../../leads/entities/lead.entity';
import { User } from '../../users/entities/user.entity';
export declare enum AppointmentStatus {
    SCHEDULED = "SCHEDULED",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    NO_SHOW = "NO_SHOW"
}
export declare class Appointment {
    id: number;
    lead_id: number;
    lead: Lead;
    usuario_id: number;
    usuario: User;
    data_agendamento: Date;
    status: AppointmentStatus;
    observacoes: string;
    created_at: Date;
    updated_at: Date;
}
