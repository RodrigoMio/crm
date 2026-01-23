import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { CreateLeadDto, OrigemLead } from '../types/lead'
import { useAuth } from '../contexts/AuthContext'
import ProductTagsInput from '../components/ProductTagsInput'
import './LeadForm.css'

export default function LeadForm() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const [formData, setFormData] = useState<CreateLeadDto>({
    nome_razao_social: '',
    uf: '',
    municipio: '',
    vendedor_id: user?.perfil === 'AGENTE' ? user.id : undefined,
    produtos: [],
    tipo_lead: [],
  })

  const [tipoLeadErrors, setTipoLeadErrors] = useState<{ comprador?: string; vendedor?: string }>({})

  // Busca dados completos do usuário logado (para Colaborador obter agente pai)
  useEffect(() => {
    if (user?.perfil === 'COLABORADOR' && user.id && !isEdit) {
      api.get('/users/me').then((res) => {
        if (res.data.usuario_pai) {
          setFormData(prev => ({ ...prev, vendedor_id: String(res.data.usuario_pai.id) }))
        }
        setFormData(prev => ({ ...prev, usuario_id_colaborador: typeof user.id === 'string' ? parseInt(user.id, 10) : user.id }))
      })
    }
  }, [user, isEdit])

  // Busca lista de colaboradores do agente logado (Agente)
  useEffect(() => {
    if (user?.perfil === 'AGENTE' && !isEdit) {
      // Preenche vendedor_id com o agente logado
      setFormData(prev => ({ ...prev, vendedor_id: user.id }))
    }
  }, [user, isEdit])

  // Busca lead se estiver editando
  const { data: lead } = useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const response = await api.get(`/leads/${id}`)
      return response.data
    },
    enabled: isEdit,
  })

  // Atualiza form quando lead é carregado
  useEffect(() => {
    if (lead) {
      setFormData({
        data_entrada: lead.data_entrada,
        nome_razao_social: lead.nome_razao_social,
        nome_fantasia_apelido: lead.nome_fantasia_apelido,
        telefone: lead.telefone,
        email: lead.email,
        uf: lead.uf,
        municipio: lead.municipio,
        anotacoes: lead.anotacoes,
        origem_lead: lead.origem_lead,
        vendedor_id: lead.vendedor_id,
        produtos: lead.produtos?.map((p: { produto_id: number }) => p.produto_id) || [],
        tipo_lead: lead.tipo_lead || [],
      })
    }
  }, [lead])

  const mutation = useMutation({
    mutationFn: async (data: CreateLeadDto) => {
      if (isEdit) {
        return api.patch(`/leads/${id}`, data)
      } else {
        return api.post('/leads', data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      navigate('/leads')
    },
  })

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
    <div className="lead-form">
      <h1>{isEdit ? 'Editar Lead' : 'Novo Lead'}</h1>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
  
          <div className="form-group">
            <label>Nome/Razão Social *</label>
            <input
              type="text"
              value={formData.nome_razao_social}
              onChange={(e) =>
                setFormData({ ...formData, nome_razao_social: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Nome Fantasia/Apelido</label>
            <input
              type="text"
              value={formData.nome_fantasia_apelido || ''}
              onChange={(e) =>
                setFormData({ ...formData, nome_fantasia_apelido: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>Data de Entrada</label>
            <input
              type="date"
              value={formData.data_entrada || ''}
              onChange={(e) => setFormData({ ...formData, data_entrada: e.target.value })}
            />
          </div>

          {/* Campos Vendedor e Colaborador ocultos */}

          <div className="form-group">
            <label>Telefone</label>
            <input
              type="tel"
              value={formData.telefone || ''}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>UF</label>
            <input
              type="text"
              maxLength={2}
              value={formData.uf || ''}
              onChange={(e) =>
                setFormData({ ...formData, uf: e.target.value.toUpperCase() })
              }
            />
          </div>
          <div className="form-group">
            <label>Município</label>
            <input
              type="text"
              value={formData.municipio || ''}
              onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Origem do Lead</label>
            <select
              value={formData.origem_lead || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  origem_lead: e.target.value ? (e.target.value as OrigemLead) : undefined,
                })
              }
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

        <div className="form-row" style={{ gridTemplateColumns: '1fr 2fr' }}>
          <div className="form-group">
            <label>Tipo de Lead *</label>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '1.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'normal', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={formData.tipo_lead?.includes('COMPRADOR') || false}
                  onChange={(e) => handleTipoLeadChange('COMPRADOR', e.target.checked)}
                  style={{ 
                    width: '18px', 
                    height: '18px', 
                    minWidth: '18px', 
                    minHeight: '18px',
                    cursor: 'pointer', 
                    margin: 0,
                    marginRight: '8px',
                    flexShrink: 0
                  }}
                />
                <span>COMPRADOR</span>
              </label>
              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'normal', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={formData.tipo_lead?.includes('VENDEDOR') || false}
                  onChange={(e) => handleTipoLeadChange('VENDEDOR', e.target.checked)}
                  style={{ 
                    width: '18px', 
                    height: '18px', 
                    minWidth: '18px', 
                    minHeight: '18px',
                    cursor: 'pointer', 
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

          <div className="form-group">
            <label>Produtos de interesse</label>
            <ProductTagsInput
              value={formData.produtos || []}
              onChange={(produtos) => setFormData({ ...formData, produtos })}
              isAdmin={user?.perfil === 'ADMIN'}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Anotações</label>
          <textarea
            value={formData.anotacoes || ''}
            onChange={(e) => setFormData({ ...formData, anotacoes: e.target.value })}
            rows={3}
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/leads')} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? 'Salvando...' : isEdit ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
}







