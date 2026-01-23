import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CompleteAppointmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Observações não podem ter mais de 255 caracteres' })
  observacoes?: string;
}



