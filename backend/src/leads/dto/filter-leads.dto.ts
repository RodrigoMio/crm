import { IsString, IsOptional, IsEnum, IsArray, IsInt, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { LeadStatus, OrigemLead } from '../entities/lead.entity';

export class FilterLeadsDto {
  @IsOptional()
  @IsString()
  nome_razao_social?: string;

  @IsOptional()
  @Transform(({ value }) => {
    // Se for string, converte para array
    if (typeof value === 'string') {
      return [value];
    }
    // Se já for array, retorna como está
    if (Array.isArray(value)) {
      return value;
    }
    return value;
  })
  @IsArray()
  @IsEnum(LeadStatus, { each: true })
  status?: LeadStatus[];

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
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 100;
}




