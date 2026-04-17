import { KanbanBoardType } from '../entities/kanban-board.entity';
export declare class FilterKanbanBoardsDto {
    tipo?: KanbanBoardType;
    agente_id?: number;
    colaborador_id?: number;
    usuario_id_dono?: number;
    nome?: string;
    tipo_fluxo?: 'COMPRADOR' | 'VENDEDOR';
}
