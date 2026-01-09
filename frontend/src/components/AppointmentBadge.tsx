import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import { Appointment } from '../types/appointment'

interface AppointmentBadgeProps {
  leadId: number
}

export default function AppointmentBadge({ leadId }: AppointmentBadgeProps) {
  const { data: appointment } = useQuery<Appointment | null>({
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
    staleTime: 30000, // Cache por 30 segundos
  })

  if (!appointment) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.25rem 0.5rem',
        backgroundColor: '#e3f2fd',
        color: '#1976d2',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 500,
        marginTop: '0.5rem',
      }}
      title={`Agendado para: ${formatDate(appointment.data_agendamento)}`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
      <span>{formatDate(appointment.data_agendamento)}</span>
    </div>
  )
}


