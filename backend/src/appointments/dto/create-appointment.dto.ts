import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateAppointmentDto {
  @IsNotEmpty()
  @IsDateString()
  data_agendamento: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}


