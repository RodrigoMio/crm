import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { Appointment, CreateAppointmentDto, RescheduleAppointmentDto } from '../types/appointment'
import { Lead } from '../types/lead'
import './ScheduleContactModal.css'

interface ScheduleContactModalProps {
  leadId: number
  leadName?: string
  onClose: () => void
  invalidateQueries?: string[]
}

export default function ScheduleContactModal({ 
  leadId, 
  leadName, 
  onClose,
  invalidateQueries = []
}: ScheduleContactModalProps) {
  const queryClient = useQueryClient()
  const [dataAgendamento, setDataAgendamento] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [dataOriginal, setDataOriginal] = useState('')

  // Busca dados completos do lead (com vendedor e colaborador)
  const { data: lead, isLoading: isLoadingLead } = useQuery<Lead>({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      const response = await api.get(`/leads/${leadId}`)
      return response.data
    },
  })

  // Busca agendamento SCHEDULED do lead
  const { data: scheduledAppointment, isLoading: isLoadingAppointment } = useQuery<Appointment | null>({
    queryKey: ['appointments', leadId, 'scheduled'],
    queryFn: async () => {
      try {
        const response = await api.get(`/leads/${leadId}/appointments/scheduled`)
        return response.data
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null
        }
        throw error
      }
    },
  })

  const isLoading = isLoadingLead || isLoadingAppointment

  // Inicializa campos quando o agendamento é carregado
  useEffect(() => {
    if (scheduledAppointment) {
      const date = new Date(scheduledAppointment.data_agendamento)
      // Formata para datetime-local (YYYY-MM-DDTHH:mm)
      const formattedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
      setDataAgendamento(formattedDate)
      setDataOriginal(formattedDate)
      setObservacoes(scheduledAppointment.observacoes || '')
    } else {
      setDataAgendamento('')
      setDataOriginal('')
      setObservacoes('')
    }
  }, [scheduledAppointment])

  // Mutation para criar agendamento
  const createMutation = useMutation({
    mutationFn: async (data: CreateAppointmentDto) => {
      return api.post(`/leads/${leadId}/appointments`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', leadId] })
      invalidateQueries.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })
      toast.success('Agendamento criado com sucesso!')
      onClose()
    },
    onError: (error: any) => {
      console.error('Erro ao criar agendamento:', error)
    },
  })

  // Mutation para reagendar
  const rescheduleMutation = useMutation({
    mutationFn: async (data: RescheduleAppointmentDto) => {
      if (!scheduledAppointment) throw new Error('Agendamento não encontrado')
      return api.patch(`/appointments/${scheduledAppointment.id}/reschedule`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', leadId] })
      invalidateQueries.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })
      toast.success('Agendamento reagendado com sucesso!')
      onClose()
    },
    onError: (error: any) => {
      console.error('Erro ao reagendar:', error)
    },
  })

  // Mutation para cancelar
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!scheduledAppointment) throw new Error('Agendamento não encontrado')
      return api.patch(`/appointments/${scheduledAppointment.id}/cancel`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', leadId] })
      invalidateQueries.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })
      toast.success('Agendamento cancelado com sucesso!')
      onClose()
    },
    onError: (error: any) => {
      console.error('Erro ao cancelar agendamento:', error)
    },
  })

  // Mutation para marcar como não realizado
  const noShowMutation = useMutation({
    mutationFn: async () => {
      if (!scheduledAppointment) throw new Error('Agendamento não encontrado')
      return api.patch(`/appointments/${scheduledAppointment.id}/no-show`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', leadId] })
      invalidateQueries.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })
      toast.success('Agendamento marcado como não realizado!')
      onClose()
    },
    onError: (error: any) => {
      console.error('Erro ao marcar como não realizado:', error)
    },
  })

  // Valida se a data é hoje ou futura
  const validateDate = (dateString: string): boolean => {
    if (!dateString) return false
    const selectedDate = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    selectedDate.setHours(0, 0, 0, 0)
    return selectedDate >= today
  }

  // Verifica se a data foi alterada
  const dataAlterada = dataAgendamento !== dataOriginal

  // Valida se Agente e Colaborador estão definidos
  const hasVendedor = !!lead?.vendedor_id && lead.vendedor_id !== '' && lead.vendedor_id !== null
  const hasColaborador = !!lead?.usuario_id_colaborador && lead.usuario_id_colaborador !== null
  const canSchedule = hasVendedor && hasColaborador

  // Formata texto do Agente/Colaborador
  const getAgenteColaboradorText = () => {
    if (!lead) return 'Carregando...'
    
    const agenteNome = lead.vendedor?.nome || 'Sem Agente definido'
    const colaboradorNome = lead.colaborador?.nome || 'Sem colaborador definido'
    
    return `${agenteNome} / ${colaboradorNome}`
  }

  const handleAgendar = () => {
    if (!dataAgendamento) {
      toast.warning('Por favor, informe a data e hora do agendamento')
      return
    }

    if (!validateDate(dataAgendamento)) {
      toast.warning('A data do agendamento deve ser hoje ou uma data futura')
      return
    }

    createMutation.mutate({
      data_agendamento: new Date(dataAgendamento).toISOString(),
      observacoes: observacoes.trim() || undefined,
    })
  }

  const handleReagendar = () => {
    if (!dataAgendamento) {
      toast.warning('Por favor, informe a data e hora do agendamento')
      return
    }

    if (!validateDate(dataAgendamento)) {
      toast.warning('A data do agendamento deve ser hoje ou uma data futura')
      return
    }

    rescheduleMutation.mutate({
      data_agendamento: new Date(dataAgendamento).toISOString(),
    })
  }

  const handleCancelar = () => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
      return
    }
    cancelMutation.mutate()
  }

  const handleNaoRealizado = () => {
    if (!confirm('Tem certeza que deseja marcar este agendamento como não realizado?')) {
      return
    }
    noShowMutation.mutate()
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="schedule-modal-overlay" onClick={onClose}>
        <div className="schedule-modal-content" onClick={(e) => e.stopPropagation()}>
          <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>
        </div>
      </div>
    )
  }

  const hasScheduled = !!scheduledAppointment

  return (
    <div className="schedule-modal-overlay" onClick={onClose}>
      <div className="schedule-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="schedule-modal-header">
          <h2>Agendar contato</h2>
          <button onClick={onClose} className="schedule-modal-close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="schedule-modal-body">
          <div className="schedule-lead-name">
            {leadName || '[NOME DO LEAD]'}
          </div>

          <div className="schedule-form-group">
            <label htmlFor="agente-colaborador">Agente/Colaborador</label>
            <div
              id="agente-colaborador"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'inherit',
                backgroundColor: '#f9f9f9',
                color: '#333',
              }}
            >
              {getAgenteColaboradorText()}
            </div>
            {!canSchedule && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.75rem',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '4px',
                fontSize: '13px',
                color: '#856404',
              }}>
                Permitido agendamento somente com Agente e Colaborador definidos
              </div>
            )}
          </div>

          <div className="schedule-form-group">
            <label htmlFor="data-agendamento">Agendar para</label>
            <input
              id="data-agendamento"
              type="datetime-local"
              value={dataAgendamento}
              onChange={(e) => setDataAgendamento(e.target.value)}
              required
              disabled={hasScheduled && !dataAlterada}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            />
            {hasScheduled && scheduledAppointment && (
              <div style={{ fontSize: '12px', color: '#666', marginTop: '0.25rem' }}>
                Agendado em: {formatDateTime(scheduledAppointment.created_at)}
                {scheduledAppointment.usuario && ` por ${scheduledAppointment.usuario.nome}`}
              </div>
            )}
          </div>

          <div className="schedule-form-group">
            <label htmlFor="observacoes">Observações (opcional)</label>
            <textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Digite observações sobre o agendamento..."
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          <div className="schedule-modal-actions">
            {!hasScheduled ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="schedule-btn-secondary"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={handleAgendar}
                  disabled={createMutation.isPending || !dataAgendamento || !canSchedule}
                  className="schedule-btn-primary"
                >
                  {createMutation.isPending ? 'Agendando...' : 'Agendar'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="schedule-btn-secondary"
                >
                  Fechar
                </button>
                {dataAlterada && (
                  <button
                    type="button"
                    onClick={handleReagendar}
                    disabled={rescheduleMutation.isPending || !canSchedule}
                    className="schedule-btn-primary"
                  >
                    {rescheduleMutation.isPending ? 'Reagendando...' : 'Reagendar'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCancelar}
                  disabled={cancelMutation.isPending}
                  className="schedule-btn-danger"
                >
                  {cancelMutation.isPending ? 'Cancelando...' : 'Cancelar agendamento'}
                </button>
                <button
                  type="button"
                  onClick={handleNaoRealizado}
                  disabled={noShowMutation.isPending}
                  className="schedule-btn-warning"
                >
                  {noShowMutation.isPending ? 'Processando...' : 'Não realizado'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

