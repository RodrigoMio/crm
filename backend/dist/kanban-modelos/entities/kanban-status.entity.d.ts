import { KanbanModeloStatus } from './kanban-modelo-status.entity';
export declare class KanbanStatus {
    kanban_status_id: number;
    descricao: string;
    bg_color: string;
    text_color: string;
    active: boolean;
    modeloStatuses: KanbanModeloStatus[];
}
