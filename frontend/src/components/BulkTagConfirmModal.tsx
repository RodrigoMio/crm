import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import './BulkTagConfirmModal.css'

interface BulkTagConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  produtoId: number
  produtoDescricao: string
  boardId: number
  filters: any
  onSuccess: () => void
}

export default function BulkTagConfirmModal({
  isOpen,
  onClose,
  produtoId,
  produtoDescricao,
  boardId,
  filters,
  onSuccess,
}: BulkTagConfirmModalProps) {
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState<'add' | 'remove' | null>(null)

  // Fechar com tecla ESC
  useEffect(() => {
    if (!isOpen) return
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, loading, onClose])

  const handleAdd = async () => {
    setLoading(true)
    setAction('add')
    try {
      const params = new URLSearchParams()
      if (filters.nome_razao_social) {
        params.append('nome_razao_social', filters.nome_razao_social)
      }
      if (filters.email) {
        params.append('email', filters.email)
      }
      if (filters.telefone) {
        params.append('telefone', filters.telefone)
      }
      if (filters.uf) {
        const ufs = Array.isArray(filters.uf) ? filters.uf : [filters.uf]
        ufs.forEach((uf: string) => {
          params.append('uf', uf)
        })
      }
      if (filters.vendedor_id) {
        params.append('vendedor_id', filters.vendedor_id.toString())
      }
      if (filters.usuario_id_colaborador) {
        params.append('usuario_id_colaborador', filters.usuario_id_colaborador.toString())
      }
      if (filters.origem_lead) {
        params.append('origem_lead', filters.origem_lead)
      }

      const response = await api.post(
        `/kanban-boards/${boardId}/leads/bulk-add-produto?${params.toString()}`,
        { produto_id: produtoId }
      )

      const data = response.data
      toast.success(`Tag "${produtoDescricao}" adicionada para ${data.affected} de ${data.total} leads visíveis`)
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Erro ao adicionar tag:', error)
      toast.error(error.response?.data?.message || error.message || 'Erro ao adicionar tag')
    } finally {
      setLoading(false)
      setAction(null)
    }
  }

  const handleRemove = async () => {
    setLoading(true)
    setAction('remove')
    try {
      const params = new URLSearchParams()
      if (filters.nome_razao_social) {
        params.append('nome_razao_social', filters.nome_razao_social)
      }
      if (filters.email) {
        params.append('email', filters.email)
      }
      if (filters.telefone) {
        params.append('telefone', filters.telefone)
      }
      if (filters.uf) {
        const ufs = Array.isArray(filters.uf) ? filters.uf : [filters.uf]
        ufs.forEach((uf: string) => {
          params.append('uf', uf)
        })
      }
      if (filters.vendedor_id) {
        params.append('vendedor_id', filters.vendedor_id.toString())
      }
      if (filters.usuario_id_colaborador) {
        params.append('usuario_id_colaborador', filters.usuario_id_colaborador.toString())
      }
      if (filters.origem_lead) {
        params.append('origem_lead', filters.origem_lead)
      }

      const response = await api.delete(
        `/kanban-boards/${boardId}/leads/bulk-remove-produto?${params.toString()}`,
        { data: { produto_id: produtoId } }
      )

      const data = response.data
      toast.success(`Tag "${produtoDescricao}" removida de ${data.affected} de ${data.total} leads visíveis`)
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Erro ao remover tag:', error)
      toast.error(error.response?.data?.message || error.message || 'Erro ao remover tag')
    } finally {
      setLoading(false)
      setAction(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="bulk-tag-confirm-modal-overlay" onClick={loading ? undefined : onClose}>
      <div className="bulk-tag-confirm-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="bulk-tag-confirm-modal-header">
          <h2>O que deseja fazer ?</h2>
        </div>
        <div className="bulk-tag-confirm-modal-body">
          {loading ? (
            <div className="bulk-tag-confirm-loading">
              <div className="bulk-tag-confirm-spinner"></div>
              <p>
                {action === 'add' && 'Adicionando tag...'}
                {action === 'remove' && 'Removendo tag...'}
              </p>
            </div>
          ) : (
            <>
              <button
                onClick={handleAdd}
                className="bulk-tag-confirm-btn-add"
                disabled={loading}
              >
                Adicionar a tag [{produtoDescricao}] para todos os leads visíveis
              </button>
              <button
                onClick={handleRemove}
                className="bulk-tag-confirm-btn-remove"
                disabled={loading}
              >
                Remover a tag [{produtoDescricao}] de todos os leads visíveis
              </button>
              <button
                onClick={onClose}
                className="bulk-tag-confirm-btn-cancel"
                disabled={loading}
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
