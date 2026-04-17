import { KanbanModeloStatus } from './kanban-modelo-status.entity';
export declare class KanbanModelo {
    kanban_modelo_id: number;
    descricao: string;
    active: boolean;
    tipo_fluxo: 'COMPRADOR' | 'VENDEDOR' | null;
    modeloStatuses: KanbanModeloStatus[];
}
