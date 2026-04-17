import { KanbanBoardType } from '../entities/kanban-board.entity';
export declare class CreateKanbanBoardDto {
    nome: string;
    cor_hex: string;
    usuario_id_dono?: number;
    agente_id?: number;
    colaborador_id?: number;
    kanban_modelo_id?: number;
    kanban_status_id?: number;
    tipo: KanbanBoardType;
    ordem?: number;
    tipo_fluxo?: 'COMPRADOR' | 'VENDEDOR';
}
