import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { CreateLeadDto, LeadStatus, ItemInteresse, OrigemLead } from '../types/lead'
import { useAuth } from '../contexts/AuthContext'
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
    vendedor_id: user?.id || '',
  })

  const [agentes, setAgentes] = useState<any[]>([])

  // Busca lista de agentes
  useEffect(() => {
    api.get('/users/agentes').then((res) => {
      setAgentes(res.data)
      // Se for Agente, já define ele mesmo como vendedor
      if (user?.perfil === 'AGENTE' && !formData.vendedor_id) {
        setFormData((prev) => ({ ...prev, vendedor_id: user.id }))
      }
    })
  }, [user])

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
        status: lead.status || [],
        itens_interesse: lead.itens_interesse || [],
        origem_lead: lead.origem_lead,
        vendedor_id: lead.vendedor_id,
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

  const handleStatusChange = (status: LeadStatus, checked: boolean) => {
    setFormData((prev) => {
      const current = prev.status || []
      if (checked) {
        return { ...prev, status: [...current, status] }
      } else {
        return { ...prev, status: current.filter((s) => s !== status) }
      }
    })
  }

  const handleItemInteresseChange = (item: ItemInteresse, checked: boolean) => {
    setFormData((prev) => {
      const current = prev.itens_interesse || []
      if (checked) {
        return { ...prev, itens_interesse: [...current, item] }
      } else {
        return { ...prev, itens_interesse: current.filter((i) => i !== item) }
      }
    })
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
            <label>Data de Entrada *</label>
            <input
              type="date"
              value={formData.data_entrada || new Date().toISOString().split('T')[0]}
              onChange={(e) => setFormData({ ...formData, data_entrada: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Vendedor *</label>
            <select
              value={formData.vendedor_id}
              onChange={(e) => setFormData({ ...formData, vendedor_id: e.target.value })}
              required
              disabled={user?.perfil === 'AGENTE'}
            >
              <option value="">Selecione...</option>
              {agentes.map((agente) => (
                <option key={agente.id} value={agente.id}>
                  {agente.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

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
        </div>

        <div className="form-row">
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
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>UF *</label>
            <input
              type="text"
              maxLength={2}
              value={formData.uf}
              onChange={(e) =>
                setFormData({ ...formData, uf: e.target.value.toUpperCase() })
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Município *</label>
            <input
              type="text"
              value={formData.municipio}
              onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
              required
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
          <label>Status (multiselect)</label>
          <div className="checkbox-group">
            {Object.values(LeadStatus).map((status) => (
              <label key={status} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.status?.includes(status) || false}
                  onChange={(e) => handleStatusChange(status, e.target.checked)}
                />
                {formatLabel(status)}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Itens de Interesse (multiselect)</label>
          <div className="checkbox-group">
            {Object.values(ItemInteresse).map((item) => (
              <label key={item} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.itens_interesse?.includes(item) || false}
                  onChange={(e) => handleItemInteresseChange(item, e.target.checked)}
                />
                {item}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Anotações</label>
          <textarea
            value={formData.anotacoes || ''}
            onChange={(e) => setFormData({ ...formData, anotacoes: e.target.value })}
            rows={5}
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




