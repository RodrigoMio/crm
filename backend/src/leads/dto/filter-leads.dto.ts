import { IsString, IsOptional, IsInt, Min, IsArray, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { OrigemLead } from '../entities/lead.entity';

export class FilterLeadsDto {
  @IsOptional()
  @IsString()
  nome_razao_social?: string;

  @IsOptional()
  @IsString()
  uf?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vendedor_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  usuario_id_colaborador?: number;

  @IsOptional()
  @IsEnum(OrigemLead)
  origem_lead?: OrigemLead;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  produtos?: number[];

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




