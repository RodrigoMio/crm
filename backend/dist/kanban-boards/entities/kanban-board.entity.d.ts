import { User } from '../../users/entities/user.entity';
import { KanbanModelo } from '../../kanban-modelos/entities/kanban-modelo.entity';
import { KanbanStatus } from '../../kanban-modelos/entities/kanban-status.entity';
export declare enum KanbanBoardType {
    ADMIN = "ADMIN",
    AGENTE = "AGENTE",
    COLABORADOR = "COLABORADOR"
}
export declare class KanbanBoard {
    id: number;
    nome: string;
    cor_hex: string;
    usuario_id_dono: number;
    usuario_dono: User;
    agente_id: number;
    agente: User;
    colaborador_id: number;
    colaborador: User;
    kanban_modelo_id: number;
    modelo: KanbanModelo;
    ordem: number;
    tipo: KanbanBoardType;
    kanban_status_id: number;
    kanbanStatus: KanbanStatus;
    id_usuario_created_at: number;
    usuario_criador: User;
    active: boolean;
    created_at: Date;
    updated_at: Date;
    tipo_fluxo: 'COMPRADOR' | 'VENDEDOR' | null;
    limit_days: number;
}
