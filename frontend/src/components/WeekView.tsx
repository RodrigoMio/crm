import { Appointment } from '../types/appointment'
import AppointmentCard from './AppointmentCard'
import { Lead } from '../types/lead'
import './WeekView.css'

interface WeekViewProps {
  appointments: Appointment[]
  currentDate: Date
  onEdit?: (lead: Lead) => void
  onOccurrences?: (lead: Lead) => void
  onSchedule?: (lead: Lead) => void
  onConfirm?: (appointment: Appointment) => void
  onDragStart?: (e: React.DragEvent, appointment: Appointment) => void
  onDragEnd?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent, date: Date) => void
  onDragOver?: (e: React.DragEvent, date: Date) => void
  draggedAppointment?: Appointment | null
  user?: {
    id: number | string
    nome: string
    email: string
    perfil: string
  } | null
}

export default function WeekView({
  appointments,
  currentDate,
  onEdit,
  onOccurrences,
  onSchedule,
  onConfirm,
  onDragStart,
  onDragEnd,
  onDrop,
  onDragOver,
  draggedAppointment,
  user,
}: WeekViewProps) {
  // Encontra o domingo da semana atual
  const getSunday = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
  }

  const sunday = getSunday(currentDate)
  const weekDays: Date[] = []

  // Cria array com os 7 dias da semana (domingo a sábado)
  for (let i = 0; i < 7; i++) {
    const day = new Date(sunday)
    day.setDate(sunday.getDate() + i)
    weekDays.push(day)
  }

  // Agrupa agendamentos por data
  const appointmentsByDate = new Map<string, Appointment[]>()
  appointments.forEach((appointment) => {
    const date = new Date(appointment.data_agendamento)
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    if (!appointmentsByDate.has(dateKey)) {
      appointmentsByDate.set(dateKey, [])
    }
    appointmentsByDate.get(dateKey)!.push(appointment)
  })

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isPast = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    return checkDate < today
  }

  const getDateKey = (date: Date) => {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    })
  }

  const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  return (
    <div className="week-view">
      <div className="week-view-header">
        {weekDays.map((date, index) => {
          const today = isToday(date)
          return (
            <div
              key={index}
              className={`week-view-day-header ${today ? 'today' : ''}`}
            >
              <div className="week-view-day-name">{weekDayNames[index]}</div>
              <div className="week-view-day-number">{formatDate(date)}</div>
            </div>
          )
        })}
      </div>
      <div className="week-view-grid">
        {weekDays.map((date, index) => {
          const dateKey = getDateKey(date)
          const dayAppointments = appointmentsByDate.get(dateKey) || []
          const today = isToday(date)
          const past = isPast(date)
          const isDraggedOver = draggedAppointment && !past

          return (
            <div
              key={index}
              className={`week-view-day ${today ? 'today' : ''} ${past ? 'past' : ''} ${isDraggedOver ? 'drag-over' : ''}`}
              onDrop={(e) => {
                e.preventDefault()
                if (!past && onDrop) {
                  onDrop(e, date)
                }
              }}
              onDragOver={(e) => {
                e.preventDefault()
                if (!past && onDragOver) {
                  onDragOver(e, date)
                }
              }}
            >
              <div className="week-view-day-appointments">
                {dayAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onEdit={onEdit}
                    onOccurrences={onOccurrences}
                    onSchedule={onSchedule}
                    onConfirm={onConfirm}
                    draggable={appointment.status === 'SCHEDULED'}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    user={user}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

