import { Lead } from '../../leads/entities/lead.entity';
export declare enum UserProfile {
    ADMIN = "ADMIN",
    AGENTE = "AGENTE",
    COLABORADOR = "COLABORADOR"
}
export declare class User {
    id: number;
    nome: string;
    email: string;
    senha: string;
    perfil: UserProfile;
    ativo: boolean;
    usuario_id_pai: number;
    usuario_pai: User;
    created_at: Date;
    updated_at: Date;
    leads: Lead[];
    leadsColaborador: Lead[];
    colaboradores: User[];
}
