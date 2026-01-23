import { IsOptional, IsDateString, IsEnum, IsInt } from 'class-validator';
import { AppointmentStatus } from '../entities/appointment.entity';

export class FilterAppointmentsDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsInt()
  vendedor_id?: number;

  @IsOptional()
  @IsInt()
  colaborador_id?: number;
}





