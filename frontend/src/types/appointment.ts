import { Lead } from './lead'

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export interface Appointment {
  id: number
  lead_id: number
  usuario_id: number
  data_agendamento: string
  status: AppointmentStatus
  observacoes?: string
  created_at: string
  updated_at: string
  usuario?: {
    id: number
    nome: string
    email: string
  }
  lead?: Lead
}

export interface FilterAppointmentsDto {
  startDate?: string
  endDate?: string
  status?: AppointmentStatus
  vendedor_id?: number
  colaborador_id?: number
}

export interface MoveAppointmentDto {
  newDate: string
}

export interface CreateAppointmentDto {
  data_agendamento: string
  observacoes?: string
}

export interface RescheduleAppointmentDto {
  data_agendamento: string
}

