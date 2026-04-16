import { IsString, IsOptional, IsInt, Min, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterLeadsDto {
  @IsOptional()
  @IsString()
  nome_razao_social?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  uf?: string | string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vendedor_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  usuario_id_colaborador?: number;

  @IsOptional()
  @IsString()
  origem_lead?: string;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  produtos?: number[];

  @IsOptional()
  @IsString()
  tipo_lead?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 100;
}




