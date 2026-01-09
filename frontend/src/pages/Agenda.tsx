import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Appointment, AppointmentStatus, FilterAppointmentsDto, MoveAppointmentDto } from '../types/appointment'
import { Lead } from '../types/lead'
import MonthView from '../components/MonthView'
import WeekView from '../components/WeekView'
import OccurrencesModal from '../components/OccurrencesModal'
import EditLeadModal from '../components/EditLeadModal'
import ScheduleContactModal from '../components/ScheduleContactModal'
import './Agenda.css'

type ViewMode = 'month' | 'week'

const STORAGE_KEY_VIEW_MODE = 'agenda_view_mode'
const STORAGE_KEY_FILTERS = 'agenda_filters'

export default function Agenda() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Estado de visualização
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_VIEW_MODE)
    return (saved as ViewMode) || 'month'
  })

  // Estado de data atual
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date()
    if (viewMode === 'week') {
      // Encontra o domingo da semana atual
      const day = now.getDay()
      const diff = now.getDate() - day
      return new Date(now.setDate(diff))
    }
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  // Filtros com persistência no localStorage
  const [filters, setFilters] = useState<FilterAppointmentsDto>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_FILTERS)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return {
          status: undefined,
          vendedor_id: undefined,
          colaborador_id: undefined,
        }
      }
    }
    return {
      status: undefined,
      vendedor_id: undefined,
      colaborador_id: undefined,
    }
  })

  // Listas para filtros
  const [agentes, setAgentes] = useState<any[]>([])
  const [colaboradores, setColaboradores] = useState<any[]>([])

  // Estados para modais
  const [selectedLeadForOccurrences, setSelectedLeadForOccurrences] = useState<Lead | null>(null)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [selectedLeadForSchedule, setSelectedLeadForSchedule] = useState<Lead | null>(null)

  // Estados para drag and drop
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null)

  // Salva preferência de visualização
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VIEW_MODE, viewMode)
  }, [viewMode])

  // Salva filtros no localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(filters))
  }, [filters])

  // Ajusta data quando muda o modo de visualização
  useEffect(() => {
    const now = new Date()
    if (viewMode === 'week') {
      const day = now.getDay()
      const diff = now.getDate() - day
      setCurrentDate(new Date(now.setDate(diff)))
    } else {
      setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1))
    }
  }, [viewMode])

  // Busca agentes (para Admin)
  useEffect(() => {
    if (user?.perfil === 'ADMIN') {
      api.get('/users/agentes').then((res) => setAgentes(res.data))
    }
  }, [user])

  // Busca colaboradores
  useEffect(() => {
    if (user?.perfil === 'ADMIN' && filters.vendedor_id) {
      api.get(`/users/colaboradores?agente_id=${filters.vendedor_id}`).then((res) => {
        setColaboradores(res.data)
      })
    } else if (user?.perfil === 'AGENTE') {
      api.get('/users/colaboradores').then((res) => setColaboradores(res.data))
    } else {
      setColaboradores([])
    }
  }, [user, filters.vendedor_id])

  // Calcula período para busca
  const getDateRange = () => {
    if (viewMode === 'week') {
      const start = new Date(currentDate)
      const end = new Date(currentDate)
      end.setDate(end.getDate() + 6)
      return { start, end }
    } else {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      return { start, end }
    }
  }

  const { start, end } = getDateRange()

  // Busca agendamentos
  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments', start.toISOString(), end.toISOString(), filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('startDate', start.toISOString())
      params.append('endDate', end.toISOString())
      
      if (filters.status) {
        params.append('status', filters.status)
      }
      if (filters.vendedor_id) {
        params.append('vendedor_id', filters.vendedor_id.toString())
      }
      if (filters.colaborador_id) {
        params.append('colaborador_id', filters.colaborador_id.toString())
      }

      const response = await api.get(`/appointments?${params.toString()}`)
      return response.data
    },
  })

  // Mutation para mover agendamento
  const moveMutation = useMutation({
    mutationFn: async ({ id, newDate }: { id: number; newDate: string }) => {
      const moveDto: MoveAppointmentDto = { newDate }
      return api.patch(`/appointments/${id}/move`, moveDto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Agendamento movido com sucesso!')
      setDraggedAppointment(null)
    },
    onError: (error: any) => {
      console.error('Erro ao mover agendamento:', error)
      setDraggedAppointment(null)
    },
  })

  // Navegação
  const navigatePrevious = () => {
    if (viewMode === 'week') {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() - 7)
      setCurrentDate(newDate)
    } else {
      const newDate = new Date(currentDate)
      newDate.setMonth(newDate.getMonth() - 1)
      setCurrentDate(newDate)
    }
  }

  const navigateNext = () => {
    if (viewMode === 'week') {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() + 7)
      setCurrentDate(newDate)
    } else {
      const newDate = new Date(currentDate)
      newDate.setMonth(newDate.getMonth() + 1)
      setCurrentDate(newDate)
    }
  }

  const navigateToday = () => {
    const now = new Date()
    if (viewMode === 'week') {
      const day = now.getDay()
      const diff = now.getDate() - day
      setCurrentDate(new Date(now.setDate(diff)))
    } else {
      setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1))
    }
  }

  // Formatação de período
  const formatPeriod = () => {
    if (viewMode === 'week') {
      const startDate = new Date(currentDate)
      const endDate = new Date(currentDate)
      endDate.setDate(endDate.getDate() + 6)
      return `${startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`
    } else {
      return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    }
  }

  // Handlers de drag and drop
  const handleDragStart = (e: React.DragEvent, appointment: Appointment) => {
    setDraggedAppointment(appointment)
    e.dataTransfer.effectAllowed = 'move'
    // Cria preview do card
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', '')
    }
  }

  const handleDragEnd = () => {
    setDraggedAppointment(null)
  }

  const handleDragOver = (e: React.DragEvent, _date: Date) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault()
    if (!draggedAppointment) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dropDate = new Date(date)
    dropDate.setHours(0, 0, 0, 0)

    // Permite mesmo se for hoje (conforme especificação)
    if (dropDate < today) {
      toast.warning('Não é possível mover para uma data passada')
      return
    }

    moveMutation.mutate({
      id: draggedAppointment.id,
      newDate: date.toISOString(),
    })
  }

  return (
    <div className="agenda-container">
      <div className="agenda-header">
        <div className="agenda-header-left">
          <h1>Agenda</h1>
          {/* Filtro por status */}
          <select
            value={filters.status || ''}
            onChange={(e) =>
              setFilters({ ...filters, status: (e.target.value as AppointmentStatus) || undefined })
            }
            className="agenda-filter-select agenda-filter-status"
          >
            <option value="">Todos os status</option>
            <option value={AppointmentStatus.SCHEDULED}>Agendado</option>
            <option value={AppointmentStatus.COMPLETED}>Realizado</option>
            <option value={AppointmentStatus.CANCELLED}>Cancelado</option>
            <option value={AppointmentStatus.NO_SHOW}>Não realizado</option>
          </select>

          {/* Filtro por Agente (apenas Admin) */}
          {user?.perfil === 'ADMIN' && (
            <select
              value={filters.vendedor_id || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  vendedor_id: e.target.value ? parseInt(e.target.value) : undefined,
                  colaborador_id: undefined, // Reset colaborador quando muda agente
                })
              }
              className="agenda-filter-select"
            >
              <option value="">Todos os agentes</option>
              {agentes.map((agente) => (
                <option key={agente.id} value={agente.id}>
                  {agente.nome}
                </option>
              ))}
            </select>
          )}

          {/* Filtro por Colaborador */}
          {(user?.perfil === 'ADMIN' || user?.perfil === 'AGENTE') && (
            <select
              value={filters.colaborador_id || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  colaborador_id: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              className="agenda-filter-select"
            >
              <option value="">Todos os colaboradores</option>
              {colaboradores.map((colaborador) => (
                <option key={colaborador.id} value={colaborador.id}>
                  {colaborador.nome}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="agenda-controls">
          <div className="agenda-navigation">
            <button onClick={navigatePrevious} className="agenda-nav-btn">
              ←
            </button>
            <span className="agenda-period">{formatPeriod()}</span>
            <button onClick={navigateNext} className="agenda-nav-btn">
              →
            </button>
            <button onClick={navigateToday} className="agenda-today-btn">
              Hoje
            </button>
          </div>
          <div className="agenda-view-toggle">
            <button
              className={`agenda-view-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Mensal
            </button>
            <button
              className={`agenda-view-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              Semanal
            </button>
          </div>
        </div>
      </div>

      <div className="agenda-content">
        {isLoading ? (
          <div className="agenda-loading">Carregando agendamentos...</div>
        ) : viewMode === 'month' ? (
          <MonthView
            appointments={appointments}
            currentDate={currentDate}
            onEdit={(lead) => setEditingLead(lead)}
            onOccurrences={(lead) => setSelectedLeadForOccurrences(lead)}
            onSchedule={(lead) => setSelectedLeadForSchedule(lead)}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            draggedAppointment={draggedAppointment}
            user={user}
          />
        ) : (
          <WeekView
            appointments={appointments}
            currentDate={currentDate}
            onEdit={(lead) => setEditingLead(lead)}
            onOccurrences={(lead) => setSelectedLeadForOccurrences(lead)}
            onSchedule={(lead) => setSelectedLeadForSchedule(lead)}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            draggedAppointment={draggedAppointment}
            user={user}
          />
        )}
      </div>

      {/* Modais */}
      {selectedLeadForOccurrences && (
        <OccurrencesModal
          leadId={selectedLeadForOccurrences.id}
          leadName={selectedLeadForOccurrences.nome_fantasia_apelido || selectedLeadForOccurrences.nome_razao_social}
          onClose={() => setSelectedLeadForOccurrences(null)}
        />
      )}

      {editingLead && (
        <div className="modal-overlay" onClick={() => setEditingLead(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
            <EditLeadModal
              lead={editingLead}
              onClose={() => setEditingLead(null)}
              onSuccess={() => {
                setEditingLead(null)
                queryClient.invalidateQueries({ queryKey: ['appointments'] })
              }}
            />
          </div>
        </div>
      )}

      {selectedLeadForSchedule && (
        <ScheduleContactModal
          leadId={selectedLeadForSchedule.id}
          leadName={selectedLeadForSchedule.nome_fantasia_apelido || selectedLeadForSchedule.nome_razao_social}
          onClose={() => setSelectedLeadForSchedule(null)}
          invalidateQueries={['appointments']}
        />
      )}
    </div>
  )
}

