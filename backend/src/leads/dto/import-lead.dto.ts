import { IsString, IsOptional, IsEnum, IsInt, IsDateString, IsNumber } from 'class-validator';
import { OrigemLead } from '../entities/lead.entity';

/**
 * DTO para validação de dados importados da planilha
 */
export class ImportLeadDto {
  @IsOptional()
  @IsString()
  id?: string; // ID do lead (primeira coluna) - pode ser qualquer string

  @IsOptional()
  @IsDateString()
  data_entrada?: string;

  @IsString()
  nome_razao_social: string; // LEAD (obrigatório)

  @IsOptional()
  @IsString()
  nome_fantasia_apelido?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  uf?: string;

  @IsOptional()
  @IsString()
  municipio?: string;

  @IsOptional()
  @IsString()
  anotacoes?: string; // Descrição do produto

  @IsOptional()
  @IsEnum(OrigemLead)
  origem_lead?: OrigemLead;

  @IsOptional()
  @IsInt()
  vendedor_id?: number; // Vendedor ID (após buscar por nome)

  @IsOptional()
  @IsString()
  ocorrencia?: string; // Coluna OCORRENCIA da planilha

  @IsOptional()
  @IsString()
  tags?: string; // Coluna TAGS da planilha

  @IsOptional()
  @IsNumber()
  total_conversoes?: number; // Total Conversões
}

