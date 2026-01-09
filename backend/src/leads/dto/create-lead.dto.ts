import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsInt,
  IsDateString,
  IsArray,
  MinLength,
  Length,
} from 'class-validator';
import { OrigemLead } from '../entities/lead.entity';

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

  @IsOptional()
  @IsString()
  @Length(2, 2, { message: 'UF deve ter exatamente 2 caracteres' })
  uf?: string;

  @IsOptional()
  @IsString()
  municipio?: string;

  @IsOptional()
  @IsString()
  anotacoes?: string;

  @IsOptional()
  @IsEnum(OrigemLead)
  origem_lead?: OrigemLead;

  @IsOptional()
  @IsInt()
  vendedor_id?: number;

  @IsOptional()
  @IsInt()
  usuario_id_colaborador?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  produtos?: number[];
}
