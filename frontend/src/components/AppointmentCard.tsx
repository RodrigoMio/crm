import { useState, useEffect } from 'react'
import { Appointment, AppointmentStatus } from '../types/appointment'
import { Lead } from '../types/lead'
import './AppointmentCard.css'

interface AppointmentCardProps {
  appointment: Appointment
  onEdit?: (lead: Lead) => void
  onOccurrences?: (lead: Lead) => void
  onSchedule?: (lead: Lead) => void
  draggable?: boolean
  onDragStart?: (e: React.DragEvent, appointment: Appointment) => void
  onDragEnd?: (e: React.DragEvent) => void
  user?: {
    id: number | string
    nome: string
    email: string
    perfil: string
  } | null
}

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.SCHEDULED]: '#C6DCFF',
  [AppointmentStatus.COMPLETED]: '#ADF0C7',
  [AppointmentStatus.CANCELLED]: '#FFC6C6',
  [AppointmentStatus.NO_SHOW]: '#D5D5D5',
}

const STATUS_ICONS: Record<AppointmentStatus, JSX.Element> = {
  [AppointmentStatus.SCHEDULED]: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  ),
  [AppointmentStatus.COMPLETED]: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  [AppointmentStatus.CANCELLED]: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  ),
  [AppointmentStatus.NO_SHOW]: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
    </svg>
  ),
}

export default function AppointmentCard({
  appointment,
  onEdit,
  onOccurrences,
  onSchedule,
  draggable = false,
  onDragStart,
  onDragEnd,
  user,
}: AppointmentCardProps) {
  const [openMenu, setOpenMenu] = useState(false)
  const lead = appointment.lead

  useEffect(() => {
    if (openMenu) {
      const handleClickOutside = () => setOpenMenu(false)
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openMenu])

  const isScheduled = appointment.status === AppointmentStatus.SCHEDULED

  if (!lead) return null

  return (
    <div
      className={`appointment-card ${isScheduled ? 'draggable' : ''}`}
      style={{ backgroundColor: STATUS_COLORS[appointment.status] }}
      draggable={draggable && isScheduled}
      onDragStart={(e) => {
        if (draggable && isScheduled && onDragStart) {
          onDragStart(e, appointment)
        }
      }}
      onDragEnd={(e) => {
        if (onDragEnd) {
          onDragEnd(e)
        }
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="appointment-card-header">
        <div className="appointment-card-icon">
          {STATUS_ICONS[appointment.status]}
        </div>
        <div className="appointment-card-name">
          {lead.nome_fantasia_apelido || lead.nome_razao_social}
        </div>
        <div className="appointment-card-menu">
          <button
            className="appointment-card-menu-btn"
            onClick={(e) => {
              e.stopPropagation()
              setOpenMenu(!openMenu)
            }}
            title="Menu"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </button>
          {openMenu && (
            <div className="appointment-card-menu-dropdown" onClick={(e) => e.stopPropagation()}>
              {onEdit && (
                <button
                  className="appointment-card-menu-item"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(lead)
                    setOpenMenu(false)
                  }}
                >
                  Editar Lead
                </button>
              )}
              {onOccurrences && (
                <button
                  className="appointment-card-menu-item"
                  onClick={(e) => {
                    e.stopPropagation()
                    onOccurrences(lead)
                    setOpenMenu(false)
                  }}
                >
                  Ocorrências
                </button>
              )}
              {onSchedule && (
                <button
                  className="appointment-card-menu-item"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSchedule(lead)
                    setOpenMenu(false)
                  }}
                >
                  Agendar contato
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {lead.nome_fantasia_apelido && (
        <div className="appointment-card-subtitle">
          {lead.nome_razao_social}
        </div>
      )}

      {lead.colaborador && (
        <div className="appointment-card-colaborador">
          {user?.perfil === 'ADMIN' && lead.vendedor && (
            <span className="appointment-card-agente">{lead.vendedor.nome} - </span>
          )}
          {lead.colaborador.nome}
        </div>
      )}

      {lead.kanbanStatus && (
        <div className="appointment-card-status">
          <span
            className="appointment-card-status-badge"
            style={{
              backgroundColor: lead.kanbanStatus.bg_color || '#e0e0e0',
              color: lead.kanbanStatus.text_color || '#000',
            }}
          >
            {lead.kanbanStatus.descricao}
          </span>
        </div>
      )}

      {appointment.observacoes && (
        <div
          className="appointment-card-observations"
          title={appointment.observacoes}
        >
          {appointment.observacoes}
        </div>
      )}
    </div>
  )
}

