import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import './ConfirmContactModal.css'

interface ConfirmContactModalProps {
  appointmentId: number
  leadName: string
  onClose: () => void
  invalidateQueries?: string[]
}

export default function ConfirmContactModal({
  appointmentId,
  leadName,
  onClose,
  invalidateQueries = [],
}: ConfirmContactModalProps) {
  const queryClient = useQueryClient()
  const [observacoes, setObservacoes] = useState('')

  const completeMutation = useMutation({
    mutationFn: async (data: { observacoes?: string }) => {
      return api.patch(`/appointments/${appointmentId}/complete`, data)
    },
    onSuccess: () => {
      // Invalida queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      invalidateQueries.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })
      toast.success('Contato confirmado com sucesso!')
      onClose()
    },
    onError: (error: any) => {
      console.error('Erro ao confirmar contato:', error)
      toast.error(error?.response?.data?.message || 'Erro ao confirmar contato. Tente novamente.')
    },
  })

  const handleConfirm = () => {
    const data: { observacoes?: string } = {}
    if (observacoes.trim()) {
      data.observacoes = observacoes.trim()
    }
    completeMutation.mutate(data)
  }

  return (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-header">
          <h2>Confirmação de contato com Lead</h2>
          <button onClick={onClose} className="confirm-modal-close">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="confirm-modal-body">
          <div className="confirm-lead-name">
            <label>Lead</label>
            <div className="confirm-lead-name-value">{leadName}</div>
          </div>

          <div className="confirm-form-group">
            <label htmlFor="observacoes">Observações deste contato</label>
            <textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informe observações sobre o contato"
              rows={5}
              maxLength={255}
            />
          </div>

          <div className="confirm-info-message">
            Ao confirmar, este agendamento será marcado como "Realizado"
          </div>
        </div>

        <div className="confirm-modal-footer">
          <button onClick={onClose} className="confirm-btn-cancel" disabled={completeMutation.isPending}>
            Fechar
          </button>
          <button
            onClick={handleConfirm}
            className="confirm-btn-confirm"
            disabled={completeMutation.isPending}
          >
            {completeMutation.isPending ? 'Confirmando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}



