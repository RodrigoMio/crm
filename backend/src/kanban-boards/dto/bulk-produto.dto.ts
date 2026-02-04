import { IsInt, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkAddProdutoDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  produto_id: number;
}

export class BulkRemoveProdutoDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  produto_id: number;
}
