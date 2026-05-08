import { IsString, IsNotEmpty, MaxLength, IsOptional, IsInt, IsEnum, IsHexColor, Min, Max } from 'class-validator';
import { KanbanBoardType } from '../entities/kanban-board.entity';

export class CreateKanbanBoardDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(25, { message: 'Nome não pode ter mais de 25 caracteres' })
  nome: string;

  @IsString()
  @IsNotEmpty({ message: 'Cor é obrigatória' })
  @IsHexColor({ message: 'Cor deve estar no formato hexadecimal (#RRGGBB)' })
  cor_hex: string;

  @IsOptional()
  @IsString()
  @IsHexColor({ message: 'Cor da fonte deve estar no formato hexadecimal (#RRGGBB)' })
  cor_fonte_hex?: string;

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

  @IsOptional()
  @IsString()
  tipo_fluxo?: 'COMPRADOR' | 'VENDEDOR';

  @IsOptional()
  @IsInt({ message: 'limit_days deve ser um número inteiro' })
  @Min(0, { message: 'limit_days deve ser no mínimo 0' })
  @Max(360, { message: 'limit_days deve ser no máximo 360' })
  limit_days?: number;
}
