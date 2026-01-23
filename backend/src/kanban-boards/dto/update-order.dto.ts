import { IsArray, IsInt, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateOrderDto {
  @IsArray({ message: 'board_ids deve ser um array' })
  @ArrayMinSize(1, { message: 'board_ids deve ter pelo menos 1 elemento' })
  @IsInt({ each: true, message: 'Cada board_id deve ser um número inteiro' })
  @Type(() => Number)
  board_ids: number[];
}







