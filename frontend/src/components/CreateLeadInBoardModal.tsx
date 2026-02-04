import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { CreateLeadDto, OrigemLead } from '../types/lead'
import { useAuth } from '../contexts/AuthContext'
import ProductTagsInput from './ProductTagsInput'

interface CreateLeadInBoardModalProps {
  boardId: number
  onClose: () => void
  onSuccess?: () => void
  invalidateQueries?: string[]
  tipoFluxo?: 'COMPRADOR' | 'VENDEDOR'
}

export default function CreateLeadInBoardModal({ 
  boardId, 
  onClose, 
  onSuccess,
  invalidateQueries = [],
  tipoFluxo
}: CreateLeadInBoardModalProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [tipoLeadErrors, setTipoLeadErrors] = useState<{ comprador?: string; vendedor?: string }>({})

  // Inicializa tipo_lead com o tipo_fluxo do board se fornecido
  const [formData, setFormData] = useState<CreateLeadDto>({
    nome_razao_social: '',
    uf: '',
    municipio: '',
    vendedor_id: user?.perfil === 'AGENTE' ? user.id : undefined,
    produtos: [],
    tipo_lead: tipoFluxo ? [tipoFluxo] : [],
  })

  // Busca dados completos do usuário logado (para Colaborador obter agente pai)
  useEffect(() => {
    if (user?.perfil === 'COLABORADOR' && user.id) {
      api.get('/users/me').then((res) => {
        if (res.data.usuario_pai) {
          setFormData(prev => ({ ...prev, vendedor_id: String(res.data.usuario_pai.id) }))
        }
        setFormData(prev => ({ ...prev, usuario_id_colaborador: typeof user.id === 'string' ? parseInt(user.id, 10) : user.id }))
      })
    }
  }, [user])

  // Busca lista de colaboradores do agente logado (Agente)
  useEffect(() => {
    if (user?.perfil === 'AGENTE') {
      // Preenche vendedor_id com o agente logado
      setFormData(prev => ({ ...prev, vendedor_id: user.id }))
    }
  }, [user])

  // Função para limpar dados antes de enviar (remove campos vazios exceto nome_razao_social)
  const cleanFormData = (data: CreateLeadDto): CreateLeadDto => {
    const cleaned: any = {
      nome_razao_social: data.nome_razao_social,
    }

    // Adiciona campos apenas se não estiverem vazios
    if (data.data_entrada && data.data_entrada.trim()) {
      cleaned.data_entrada = data.data_entrada
    }
    if (data.nome_fantasia_apelido && data.nome_fantasia_apelido.trim()) {
      cleaned.nome_fantasia_apelido = data.nome_fantasia_apelido
    }
    if (data.telefone && data.telefone.trim()) {
      cleaned.telefone = data.telefone
    }
    if (data.email && data.email.trim()) {
      cleaned.email = data.email
    }
    if (data.uf && data.uf.trim()) {
      cleaned.uf = data.uf.trim().toUpperCase()
    }
    if (data.municipio && data.municipio.trim()) {
      cleaned.municipio = data.municipio
    }
    if (data.anotacoes && data.anotacoes.trim()) {
      cleaned.anotacoes = data.anotacoes
    }
    if (data.origem_lead) {
      cleaned.origem_lead = data.origem_lead
    }
    if (data.vendedor_id) {
      cleaned.vendedor_id = typeof data.vendedor_id === 'string' ? parseInt(data.vendedor_id, 10) : data.vendedor_id
    }
    if (data.usuario_id_colaborador) {
      cleaned.usuario_id_colaborador = data.usuario_id_colaborador
    }
    if (data.tipo_lead && data.tipo_lead.length > 0) {
      cleaned.tipo_lead = data.tipo_lead
    }
    if (data.produtos && data.produtos.length > 0) {
      cleaned.produtos = data.produtos
    }

    return cleaned
  }

  const mutation = useMutation({
    mutationFn: async (data: CreateLeadDto) => {
      return api.post(`/kanban-boards/${boardId}/leads`, data)
    },
    onSuccess: () => {
      // Invalida as queries especificadas
      invalidateQueries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey: [queryKey] })
      })
      // Também invalida queries relacionadas ao Kanban
      queryClient.invalidateQueries({ queryKey: ['kanban-board-leads-all'] })
      queryClient.invalidateQueries({ queryKey: ['kanban-board-leads-all-agente'] })
      queryClient.invalidateQueries({ queryKey: ['kanban-board-leads-all-colaborador'] })
      queryClient.invalidateQueries({ queryKey: ['kanban-boards-admin'] })
      queryClient.invalidateQueries({ queryKey: ['kanban-boards-agente'] })
      queryClient.invalidateQueries({ queryKey: ['kanban-boards-colaborador'] })
      toast.success('Lead criado com sucesso!')
      onSuccess?.()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao criar lead')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação: pelo menos um tipo de lead deve estar selecionado
    if (!formData.tipo_lead || formData.tipo_lead.length === 0) {
      setTipoLeadErrors({ comprador: 'Selecione pelo menos uma opção' })
      return
    }
    
    setTipoLeadErrors({})
    const cleanedData = cleanFormData(formData)
    mutation.mutate(cleanedData)
  }

  const handleTipoLeadChange = (tipo: 'COMPRADOR' | 'VENDEDOR', checked: boolean) => {
    // Se o tipo corresponder ao tipoFluxo do board, não permite desmarcar
    if (tipoFluxo && tipo === tipoFluxo && !checked) {
      return
    }
    
    const currentTipos = formData.tipo_lead || []
    let newTipos: string[]
    
    if (checked) {
      newTipos = [...currentTipos, tipo]
    } else {
      newTipos = currentTipos.filter(t => t !== tipo)
    }
    
    setFormData({ ...formData, tipo_lead: newTipos })
    setTipoLeadErrors({})
  }

  const formatLabel = (value: string) => {
    return value
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ')
  }

  return (
    <div>
      <h2>Novo Lead</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label>Nome/Razão Social *</label>
            <input
              type="text"
              value={formData.nome_razao_social}
              onChange={(e) =>
                setFormData({ ...formData, nome_razao_social: e.target.value })
              }
              required
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          </div>

          <div>
            <label>Nome Fantasia/Apelido</label>
            <input
              type="text"
              value={formData.nome_fantasia_apelido || ''}
              onChange={(e) =>
                setFormData({ ...formData, nome_fantasia_apelido: e.target.value })
              }
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          </div>

          <div>
            <label>Data de Entrada</label>
            <input
              type="date"
              value={formData.data_entrada || ''}
              onChange={(e) => setFormData({ ...formData, data_entrada: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label>Telefone</label>
            <input
              type="tel"
              value={formData.telefone || ''}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          </div>

          <div>
            <label>Email</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label>UF</label>
            <input
              type="text"
              maxLength={2}
              value={formData.uf || ''}
              onChange={(e) =>
                setFormData({ ...formData, uf: e.target.value.toUpperCase() })
              }
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          </div>

          <div>
            <label>Município</label>
            <input
              type="text"
              value={formData.municipio || ''}
              onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          </div>

          <div>
            <label>Origem do Lead</label>
            <select
              value={formData.origem_lead || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  origem_lead: e.target.value ? (e.target.value as OrigemLead) : undefined,
                })
              }
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            >
              <option value="">Selecione...</option>
              {Object.values(OrigemLead).map((origem) => (
                <option key={origem} value={origem}>
                  {formatLabel(origem)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
          <div>
            <label>Tipo de Lead *</label>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '1.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: tipoFluxo === 'COMPRADOR' ? 'not-allowed' : 'pointer', fontWeight: 'normal', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={formData.tipo_lead?.includes('COMPRADOR') || false}
                  onChange={(e) => handleTipoLeadChange('COMPRADOR', e.target.checked)}
                  disabled={tipoFluxo === 'COMPRADOR'}
                  readOnly={tipoFluxo === 'COMPRADOR'}
                  style={{ 
                    width: '18px', 
                    height: '18px', 
                    minWidth: '18px', 
                    minHeight: '18px',
                    cursor: tipoFluxo === 'COMPRADOR' ? 'not-allowed' : 'pointer', 
                    margin: 0,
                    marginRight: '8px',
                    flexShrink: 0
                  }}
                />
                <span>COMPRADOR</span>
              </label>
              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: tipoFluxo === 'VENDEDOR' ? 'not-allowed' : 'pointer', fontWeight: 'normal', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={formData.tipo_lead?.includes('VENDEDOR') || false}
                  onChange={(e) => handleTipoLeadChange('VENDEDOR', e.target.checked)}
                  disabled={tipoFluxo === 'VENDEDOR'}
                  readOnly={tipoFluxo === 'VENDEDOR'}
                  style={{ 
                    width: '18px', 
                    height: '18px', 
                    minWidth: '18px', 
                    minHeight: '18px',
                    cursor: tipoFluxo === 'VENDEDOR' ? 'not-allowed' : 'pointer', 
                    margin: 0,
                    marginRight: '8px',
                    flexShrink: 0
                  }}
                />
                <span>VENDEDOR</span>
              </label>
            </div>
            {tipoLeadErrors.comprador && (
              <small style={{ color: '#d32f2f', marginTop: '0.25rem', display: 'block' }}>
                {tipoLeadErrors.comprador}
              </small>
            )}
          </div>

          <div>
            <div style={{ marginTop: '0.25rem' }}>
              <ProductTagsInput
                value={formData.produtos || []}
                onChange={(produtos) => setFormData({ ...formData, produtos })}
                isAdmin={user?.perfil === 'ADMIN'}
                showViewAllButton={true}
                label="Produtos de interesse"
              />
            </div>
          </div>
        </div>

        <div>
          <label>Anotações</label>
          <textarea
            value={formData.anotacoes || ''}
            onChange={(e) => setFormData({ ...formData, anotacoes: e.target.value })}
            rows={3}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
}
