import { IsString, IsOptional, IsEnum, IsArray, IsUUID, IsDateString } from 'class-validator';
import { LeadStatus, ItemInteresse, OrigemLead } from '../entities/lead.entity';

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
  @IsArray()
  @IsEnum(LeadStatus, { each: true })
  status?: LeadStatus[]; // Situacao

  @IsOptional()
  @IsArray()
  @IsEnum(ItemInteresse, { each: true })
  itens_interesse?: ItemInteresse[]; // Raça

  @IsOptional()
  @IsEnum(OrigemLead)
  origem_lead?: OrigemLead;

  @IsOptional()
  @IsUUID()
  vendedor_id?: string; // Vendedor (buscar por nome)
}

