export enum KanbanBoardType {
  ADMIN = 'ADMIN',
  AGENTE = 'AGENTE',
  COLABORADOR = 'COLABORADOR',
}

export interface KanbanBoard {
  id: number;
  nome: string;
  cor_hex: string;
  usuario_id_dono: number | null;
  agente_id: number | null;
  colaborador_id: number | null;
  kanban_modelo_id: number | null;
  ordem: number;
  tipo: KanbanBoardType;
  kanban_status_id: number | null;
  id_usuario_created_at: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  leads_count?: number;
  tipo_fluxo?: 'COMPRADOR' | 'VENDEDOR' | null;
}

export interface BoardWithLeadsCount extends KanbanBoard {
  leads_count: number;
}

export interface CreateKanbanBoardDto {
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

export interface UpdateKanbanBoardDto {
  nome?: string;
  cor_hex?: string;
  ordem?: number;
}

export interface MoveLeadDto {
  from_board_id: number;
  to_board_id: number;
}

export interface UpdateOrderDto {
  board_ids: number[];
}

