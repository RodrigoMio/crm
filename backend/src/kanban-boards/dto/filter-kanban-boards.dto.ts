import { IsOptional, IsInt, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { KanbanBoardType } from '../entities/kanban-board.entity';

export class FilterKanbanBoardsDto {
  @IsOptional()
  @IsEnum(KanbanBoardType)
  tipo?: KanbanBoardType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  agente_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  colaborador_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  usuario_id_dono?: number;

  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  tipo_fluxo?: 'COMPRADOR' | 'VENDEDOR';
}
