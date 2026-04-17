import { KanbanModelo } from './kanban-modelo.entity';
import { KanbanStatus } from './kanban-status.entity';
export declare class KanbanModeloStatus {
    kanban_modelo_status_id: number;
    kanban_modelo_id: number;
    kanban_status_id: number;
    kanbanModelo: KanbanModelo;
    kanbanStatus: KanbanStatus;
}
