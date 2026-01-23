import { IsString, IsNotEmpty, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class CreateKanbanModeloDto {
  @IsString()
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  @MaxLength(50, { message: 'Descrição não pode ter mais de 50 caracteres' })
  descricao: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}








