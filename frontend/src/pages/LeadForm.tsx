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
  })

  const [agentes, setAgentes] = useState<any[]>([])
  const [colaboradores, setColaboradores] = useState<any[]>([])
  const [agentePaiNome, setAgentePaiNome] = useState<string>('')

  // Busca dados completos do usuário logado (para Colaborador obter agente pai)
  useEffect(() => {
    if (user?.perfil === 'COLABORADOR' && user.id && !isEdit) {
      api.get('/users/me').then((res) => {
        if (res.data.usuario_pai) {
          setAgentePaiNome(res.data.usuario_pai.nome)
          setFormData(prev => ({ ...prev, vendedor_id: String(res.data.usuario_pai.id) }))
        }
        setFormData(prev => ({ ...prev, usuario_id_colaborador: typeof user.id === 'string' ? parseInt(user.id, 10) : user.id }))
      })
    }
  }, [user, isEdit])

  // Busca lista de agentes (Admin)
  useEffect(() => {
    if (user?.perfil === 'ADMIN' && !isEdit) {
      api.get('/users/agentes').then((res) => {
        setAgentes(res.data)
      })
    }
  }, [user, isEdit])

  // Busca lista de colaboradores do agente logado (Agente)
  useEffect(() => {
    if (user?.perfil === 'AGENTE' && !isEdit) {
      api.get('/users/colaboradores').then((res) => {
        setColaboradores(res.data)
      })
      // Preenche vendedor_id com o agente logado
      setFormData(prev => ({ ...prev, vendedor_id: user.id }))
      // Busca agentes para obter o nome
      api.get('/users/agentes').then((res) => {
        setAgentes(res.data)
      })
    }
  }, [user, isEdit])

  // Carrega colaboradores quando vendedor é selecionado (Admin)
  useEffect(() => {
    if (user?.perfil === 'ADMIN' && formData.vendedor_id && !isEdit) {
      api.get(`/users/colaboradores?agente_id=${formData.vendedor_id}`).then((res) => {
        setColaboradores(res.data)
      })
    } else if (user?.perfil === 'ADMIN' && !formData.vendedor_id && !isEdit) {
      setColaboradores([])
    }
  }, [formData.vendedor_id, user, isEdit])

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
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
            <label>Data de Entrada *</label>
            <input
              type="date"
              value={formData.data_entrada || new Date().toISOString().split('T')[0]}
              onChange={(e) => setFormData({ ...formData, data_entrada: e.target.value })}
              required
            />
          </div>

          {/* Campo Vendedor - apenas para criação (não exibir em edição) */}
          {!isEdit && (
            <>
              {user?.perfil === 'ADMIN' && (
                <div className="form-group">
                  <label>Vendedor</label>
                  <select
                    value={formData.vendedor_id || ''}
                    onChange={(e) => setFormData({ ...formData, vendedor_id: e.target.value ? e.target.value : undefined })}
                  >
                    <option value="">Selecione...</option>
                    {agentes.map((agente) => (
                      <option key={agente.id} value={agente.id}>
                        {agente.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {user?.perfil === 'AGENTE' && (
                <div className="form-group">
                  <label>Vendedor</label>
                  <input
                    type="text"
                    value={agentes.find(a => a.id === user.id)?.nome || user.nome || ''}
                    readOnly
                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                  />
                </div>
              )}

              {user?.perfil === 'COLABORADOR' && (
                <div className="form-group">
                  <label>Vendedor</label>
                  <input
                    type="text"
                    value={agentePaiNome || 'Carregando...'}
                    readOnly
                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                  />
                </div>
              )}
            </>
          )}

          {/* Campo Colaborador - apenas para criação (não exibir em edição) */}
          {!isEdit && (
            <>
              {user?.perfil === 'ADMIN' && (
                <div className="form-group">
                  <label>Colaborador</label>
                  <select
                    value={formData.usuario_id_colaborador?.toString() || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      usuario_id_colaborador: e.target.value ? Number(e.target.value) : undefined 
                    })}
                    disabled={!formData.vendedor_id}
                  >
                    <option value="">Nenhum</option>
                    {colaboradores.map((colaborador) => (
                      <option key={colaborador.id} value={colaborador.id}>
                        {colaborador.nome}
                      </option>
                    ))}
                  </select>
                  {!formData.vendedor_id && (
                    <small style={{ display: 'block', marginTop: '0.25rem', color: '#666', fontSize: '0.85em' }}>
                      Selecione um vendedor primeiro
                    </small>
                  )}
                </div>
              )}

              {user?.perfil === 'AGENTE' && (
                <div className="form-group">
                  <label>Colaborador</label>
                  <select
                    value={formData.usuario_id_colaborador?.toString() || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      usuario_id_colaborador: e.target.value ? Number(e.target.value) : undefined 
                    })}
                  >
                    <option value="">Nenhum</option>
                    {colaboradores.map((colaborador) => (
                      <option key={colaborador.id} value={colaborador.id}>
                        {colaborador.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {user?.perfil === 'COLABORADOR' && (
                <div className="form-group">
                  <label>Colaborador</label>
                  <input
                    type="text"
                    value={user.nome || ''}
                    readOnly
                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                  />
                </div>
              )}
            </>
          )}

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

        <div className="form-group">
          <label>Produtos de interesse</label>
          <ProductTagsInput
            value={formData.produtos || []}
            onChange={(produtos) => setFormData({ ...formData, produtos })}
            isAdmin={user?.perfil === 'ADMIN'}
          />
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







