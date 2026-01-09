import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateProdutoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  descricao: string;
}

