import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class MoveLeadDto {
  @IsInt({ message: 'from_board_id deve ser um número inteiro' })
  @Type(() => Number)
  @IsNotEmpty({ message: 'from_board_id é obrigatório' })
  from_board_id: number;

  @IsInt({ message: 'to_board_id deve ser um número inteiro' })
  @Type(() => Number)
  @IsNotEmpty({ message: 'to_board_id é obrigatório' })
  to_board_id: number;
}




