import { IsNotEmpty, IsInt, IsDateString } from 'class-validator';

export class CreateActivityDto {
  @IsNotEmpty({ message: 'A data da atividade é obrigatória' })
  @IsDateString({}, { message: 'A data deve estar em formato válido' })
  data: string;

  @IsNotEmpty({ message: 'A ação é obrigatória' })
  @IsInt({ message: 'O ID da ação deve ser um número inteiro' })
  ocorrencia_id: number;

  @IsNotEmpty({ message: 'O produto é obrigatório' })
  @IsInt({ message: 'O ID do produto deve ser um número inteiro' })
  produto_id: number;
}




