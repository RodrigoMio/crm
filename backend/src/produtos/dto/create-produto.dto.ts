import { IsString, MinLength, MaxLength, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProdutoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  descricao: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  produto_tipo_id?: number;
}




