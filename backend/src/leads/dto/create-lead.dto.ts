import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  IsDateString,
  MinLength,
  Length,
} from 'class-validator';
import { LeadStatus, ItemInteresse, OrigemLead } from '../entities/lead.entity';

export class CreateLeadDto {
  @IsOptional()
  @IsDateString()
  data_entrada?: string;

  @IsString()
  @MinLength(1)
  nome_razao_social: string;

  @IsOptional()
  @IsString()
  nome_fantasia_apelido?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @Length(2, 2)
  uf: string;

  @IsString()
  @MinLength(1)
  municipio: string;

  @IsOptional()
  @IsString()
  anotacoes?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(LeadStatus, { each: true })
  status?: LeadStatus[];

  @IsOptional()
  @IsArray()
  @IsEnum(ItemInteresse, { each: true })
  itens_interesse?: ItemInteresse[];

  @IsOptional()
  @IsEnum(OrigemLead)
  origem_lead?: OrigemLead;

  @IsUUID()
  vendedor_id: string;
}
