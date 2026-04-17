import { Lead } from '../../leads/entities/lead.entity';
import { User } from '../../users/entities/user.entity';
export declare enum OccurrenceType {
    SISTEMA = "SISTEMA",
    USUARIO = "USUARIO"
}
export declare class Occurrence {
    id: number;
    leads_id: number;
    lead: Lead;
    usuarios_id: number;
    usuario: User;
    texto: string;
    tipo: OccurrenceType;
    tipo_fluxo: 'COMPRADOR' | 'VENDEDOR' | null;
    created_at: Date;
}
