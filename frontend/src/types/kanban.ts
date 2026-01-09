export interface KanbanStatus {
  kanban_status_id: number;
  descricao: string;
  bg_color: string;
  text_color: string;
  active: boolean;
}

export interface KanbanModelo {
  kanban_modelo_id: number;
  descricao: string;
  active: boolean;
  statuses: KanbanStatus[];
}

export interface CreateKanbanModeloDto {
  descricao: string;
  active?: boolean;
}

export interface UpdateKanbanModeloDto {
  descricao?: string;
  active?: boolean;
}





