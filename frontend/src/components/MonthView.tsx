import { Appointment } from '../types/appointment'
import AppointmentCard from './AppointmentCard'
import { Lead } from '../types/lead'
import './MonthView.css'

interface MonthViewProps {
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

export default function MonthView({
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
}: MonthViewProps) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Primeiro dia do mês
  const firstDay = new Date(year, month, 1)
  // Último dia do mês
  const lastDay = new Date(year, month + 1, 0)
  // Dia da semana do primeiro dia (0 = domingo, 6 = sábado)
  const startDayOfWeek = firstDay.getDay()
  // Total de dias no mês
  const daysInMonth = lastDay.getDate()

  // Cria array de dias do mês
  const days: Date[] = []
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i))
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

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  return (
    <div className="month-view">
      <div className="month-view-header">
        {weekDays.map((day) => (
          <div key={day} className="month-view-day-header">
            {day}
          </div>
        ))}
      </div>
      <div className="month-view-grid">
        {/* Espaços vazios antes do primeiro dia */}
        {Array.from({ length: startDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="month-view-day empty"></div>
        ))}

        {/* Dias do mês */}
        {days.map((date) => {
          const dateKey = getDateKey(date)
          const dayAppointments = appointmentsByDate.get(dateKey) || []
          const today = isToday(date)
          const past = isPast(date)
          const isDraggedOver = draggedAppointment && !past

          return (
            <div
              key={dateKey}
              className={`month-view-day ${today ? 'today' : ''} ${past ? 'past' : ''} ${isDraggedOver ? 'drag-over' : ''}`}
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
              <div className="month-view-day-number">{date.getDate()}</div>
              <div className="month-view-day-appointments">
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

