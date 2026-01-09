import { IsNotEmpty, IsDateString } from 'class-validator';

export class MoveAppointmentDto {
  @IsNotEmpty()
  @IsDateString()
  newDate: string;
}


