import { IsString, IsNotEmpty, MaxLength, IsOptional, IsInt, IsEnum, IsHexColor } from 'class-validator';
import { KanbanBoardType } from '../entities/kanban-board.entity';

export class CreateKanbanBoardDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(20, { message: 'Nome não pode ter mais de 20 caracteres' })
  nome: string;

  @IsString()
  @IsNotEmpty({ message: 'Cor é obrigatória' })
  @IsHexColor({ message: 'Cor deve estar no formato hexadecimal (#RRGGBB)' })
  cor_hex: string;

  @IsOptional()
  @IsInt({ message: 'usuario_id_dono deve ser um número inteiro' })
  usuario_id_dono?: number;

  @IsOptional()
  @IsInt({ message: 'agente_id deve ser um número inteiro' })
  agente_id?: number;

  @IsOptional()
  @IsInt({ message: 'colaborador_id deve ser um número inteiro' })
  colaborador_id?: number;

  @IsOptional()
  @IsInt({ message: 'kanban_modelo_id deve ser um número inteiro' })
  kanban_modelo_id?: number;

  @IsOptional()
  @IsInt({ message: 'kanban_status_id deve ser um número inteiro' })
  kanban_status_id?: number;

  @IsEnum(KanbanBoardType, { message: 'Tipo deve ser ADMIN, AGENTE ou COLABORADOR' })
  tipo: KanbanBoardType;

  @IsOptional()
  @IsInt({ message: 'ordem deve ser um número inteiro' })
  ordem?: number;
}

