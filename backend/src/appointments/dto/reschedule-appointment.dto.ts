import { IsNotEmpty, IsDateString } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsNotEmpty()
  @IsDateString()
  data_agendamento: string;
}





