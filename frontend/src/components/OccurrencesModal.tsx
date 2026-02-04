import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { Occurrence, CreateOccurrenceDto, OccurrenceType } from '../types/occurrence'
import { Activity, CreateActivityDto, Ocorrencia } from '../types/activity'
import { Produto } from '../types/produto'
import { useAuth } from '../contexts/AuthContext'
import './OccurrencesModal.css'

interface OccurrencesModalProps {
  leadId: number
  leadName?: string
  onClose: () => void
}

export default function OccurrencesModal({ leadId, leadName, onClose }: OccurrencesModalProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [newOccurrenceText, setNewOccurrenceText] = useState('')
  const [activeTab, setActiveTab] = useState<'ocorrencias' | 'historico' | 'atividades'>('ocorrencias')
  
  // Estados para formulário de atividade
  const [activityData, setActivityData] = useState<string>(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [activityOcorrenciaId, setActivityOcorrenciaId] = useState<number | ''>('')
  const [activityProdutoId, setActivityProdutoId] = useState<number | ''>('')

  // Busca ocorrências do lead
  const { data: occurrences = [], isLoading } = useQuery<Occurrence[]>({
    queryKey: ['occurrences', leadId],
    queryFn: async () => {
      const response = await api.get(`/leads/${leadId}/occurrences`)
      return response.data
    },
  })

  // Mutation para criar ocorrência
  const createMutation = useMutation({
    mutationFn: async (data: CreateOccurrenceDto) => {
      return api.post(`/leads/${leadId}/occurrences`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occurrences', leadId] })
      setNewOccurrenceText('')
      toast.success('Ocorrência criada com sucesso!')
    },
    onError: (error: any) => {
      // Erro já é tratado pelo interceptor do axios
      console.error('Erro ao criar ocorrência:', error)
    },
  })

  // Mutation para excluir ocorrência
  const deleteMutation = useMutation({
    mutationFn: async (occurrenceId: number) => {
      return api.delete(`/leads/${leadId}/occurrences/${occurrenceId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occurrences', leadId] })
      toast.success('Ocorrência excluída com sucesso!')
    },
    onError: (error: any) => {
      // Erro já é tratado pelo interceptor do axios
      console.error('Erro ao excluir ocorrência:', error)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOccurrenceText.trim()) {
      toast.warning('Por favor, informe o texto da ocorrência')
      return
    }
    createMutation.mutate({
      texto: newOccurrenceText.trim(),
      tipo: OccurrenceType.SISTEMA,
    })
  }

  const canDelete = (occurrence: Occurrence): boolean => {
    if (occurrence.tipo !== OccurrenceType.USUARIO) return false
    const userId = typeof user?.id === 'string' ? parseInt(user.id, 10) : user?.id
    if (occurrence.usuarios_id !== userId) return false
    
    const createdAt = new Date(occurrence.created_at)
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)
    
    return createdAt >= oneHourAgo
  }

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

  // Filtra ocorrências por tipo e ordena por data decrescente
  const ocorrenciasUsuario = occurrences
    .filter((o) => o.tipo === OccurrenceType.USUARIO)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const ocorrenciasSistema = occurrences
    .filter((o) => o.tipo === OccurrenceType.SISTEMA)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Busca atividades do lead
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery<Activity[]>({
    queryKey: ['activities', leadId],
    queryFn: async () => {
      const response = await api.get(`/leads/${leadId}/activities`)
      return response.data
    },
    enabled: activeTab === 'atividades',
  })

  // Busca lista de ocorrências para o select
  const { data: ocorrenciasList = [] } = useQuery<Ocorrencia[]>({
    queryKey: ['ocorrencias'],
    queryFn: async () => {
      const response = await api.get('/ocorrencias')
      return response.data
    },
    enabled: activeTab === 'atividades',
  })

  // Busca lista de produtos para o select
  const { data: produtosList = [] } = useQuery<Produto[]>({
    queryKey: ['produtos', 'all'],
    queryFn: async () => {
      const response = await api.get('/produtos?search=')
      return response.data
    },
    enabled: activeTab === 'atividades',
  })

  // Mutation para criar atividade
  const createActivityMutation = useMutation({
    mutationFn: async (data: CreateActivityDto) => {
      return api.post(`/leads/${leadId}/activities`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', leadId] })
      // Reset form
      const today = new Date()
      setActivityData(today.toISOString().split('T')[0])
      setActivityOcorrenciaId('')
      setActivityProdutoId('')
      toast.success('Atividade criada com sucesso!')
    },
    onError: (error: any) => {
      console.error('Erro ao criar atividade:', error)
    },
  })

  // Mutation para excluir atividade
  const deleteActivityMutation = useMutation({
    mutationFn: async (activityId: number) => {
      return api.delete(`/leads/${leadId}/activities/${activityId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', leadId] })
      toast.success('Atividade excluída com sucesso!')
    },
    onError: (error: any) => {
      console.error('Erro ao excluir atividade:', error)
    },
  })

  const handleActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activityData || !activityOcorrenciaId || !activityProdutoId) {
      toast.warning('Por favor, preencha todos os campos')
      return
    }
    createActivityMutation.mutate({
      data: activityData,
      ocorrencia_id: Number(activityOcorrenciaId),
      produto_id: Number(activityProdutoId),
    })
  }

  const canDeleteActivity = (activity: Activity): boolean => {
    // Admin sempre pode remover
    if (user?.perfil === 'ADMIN') {
      return true
    }

    // Verifica se é do próprio usuário
    const userId = typeof user?.id === 'string' ? parseInt(user.id, 10) : user?.id
    if (activity.created_at_usuarios_id !== userId) {
      return false
    }

    // Verifica se foi criada há menos de 1 hora
    const createdAt = new Date(activity.created_at)
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)

    return createdAt >= oneHourAgo
  }

  const formatActivityDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // Função para renderizar texto com quebras de linha e links
  const renderTextWithLinks = (text: string) => {
    if (!text) return text
    
    // Regex para detectar URLs (http:// ou https://)
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = text.split(urlRegex)
    
    return parts.map((part, index) => {
      // Verifica se a parte é uma URL
      if (part.startsWith('http://') || part.startsWith('https://')) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#007bff', textDecoration: 'underline' }}
          >
            {part}
          </a>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  return (
    <div className="occurrences-modal-overlay" onClick={onClose}>
      <div className="occurrences-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="occurrences-modal-header">
          <h2>{leadName || 'Ocorrências'}</h2>
          <button onClick={onClose} className="occurrences-modal-close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="occurrences-modal-body">
          {/* Abas */}
          <div className="occurrences-tabs">
            <button
              className={`occurrences-tab ${activeTab === 'ocorrencias' ? 'active' : ''}`}
              onClick={() => setActiveTab('ocorrencias')}
            >
              Ocorrências
            </button>
            <button
              className={`occurrences-tab ${activeTab === 'historico' ? 'active' : ''}`}
              onClick={() => setActiveTab('historico')}
            >
              Histórico
            </button>
            <button
              className={`occurrences-tab ${activeTab === 'atividades' ? 'active' : ''}`}
              onClick={() => setActiveTab('atividades')}
            >
              Atividades
            </button>
          </div>

          {/* Conteúdo da aba Ocorrências */}
          {activeTab === 'ocorrencias' && (
            <div className="occurrences-tab-content">
              {/* Formulário de nova ocorrência */}
              <div className="occurrences-form">
                <h3>Nova ocorrência</h3>
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '1rem' }}>
                    <textarea
                      value={newOccurrenceText}
                      onChange={(e) => setNewOccurrenceText(e.target.value)}
                      placeholder="Digite a ocorrência..."
                      maxLength={1000}
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
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '0.25rem' }}>
                      {newOccurrenceText.length}/1000 caracteres
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || !newOccurrenceText.trim()}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: createMutation.isPending || !newOccurrenceText.trim() ? 'not-allowed' : 'pointer',
                      opacity: createMutation.isPending || !newOccurrenceText.trim() ? 0.6 : 1,
                    }}
                  >
                    {createMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </button>
                </form>
              </div>

              {/* Lista de ocorrências do tipo USUARIO */}
              <div className="occurrences-list">
                <h3>Ocorrências</h3>
                {isLoading ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>
                ) : ocorrenciasUsuario.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                    Nenhuma ocorrência encontrada
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Data</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Usuário</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Texto</th>
                          <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ocorrenciasUsuario.map((occurrence) => (
                          <tr key={occurrence.id}>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
                              {formatDate(occurrence.created_at)}
                            </td>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
                              {occurrence.usuario?.nome || '-'}
                            </td>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {renderTextWithLinks(occurrence.texto)}
                            </td>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                              {canDelete(occurrence) && (
                                <button
                                  onClick={() => {
                                    if (confirm('Tem certeza que deseja excluir esta ocorrência?')) {
                                      deleteMutation.mutate(occurrence.id)
                                    }
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '0.25rem',
                                    color: '#e74c3c',
                                  }}
                                  title="Excluir ocorrência"
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  </svg>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conteúdo da aba Histórico */}
          {activeTab === 'historico' && (
            <div className="occurrences-tab-content">
              <div className="occurrences-list">
                <h3>Histórico</h3>
                {isLoading ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>
                ) : ocorrenciasSistema.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                    Nenhum registro no histórico
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Data</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Usuário</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Texto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ocorrenciasSistema.map((occurrence) => (
                          <tr key={occurrence.id}>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
                              {formatDate(occurrence.created_at)}
                            </td>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
                              {occurrence.usuario?.nome || '-'}
                            </td>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {renderTextWithLinks(occurrence.texto)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conteúdo da aba Atividades */}
          {activeTab === 'atividades' && (
            <div className="occurrences-tab-content">
              {/* Formulário de nova atividade */}
              <div className="occurrences-form">
                <h3>Nova atividade</h3>
                <form onSubmit={handleActivitySubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                        Data da atividade
                      </label>
                      <input
                        type="date"
                        value={activityData}
                        onChange={(e) => setActivityData(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                        Ação
                      </label>
                      <select
                        value={activityOcorrenciaId}
                        onChange={(e) => setActivityOcorrenciaId(e.target.value ? Number(e.target.value) : '')}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                        }}
                      >
                        <option value="">Selecione a ação</option>
                        {ocorrenciasList.map((ocorrencia) => (
                          <option key={ocorrencia.ocorrencia_id} value={ocorrencia.ocorrencia_id}>
                            {ocorrencia.descricao}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                        Produto
                      </label>
                      <select
                        value={activityProdutoId}
                        onChange={(e) => setActivityProdutoId(e.target.value ? Number(e.target.value) : '')}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                        }}
                      >
                        <option value="">Selecione o produto</option>
                        {produtosList.map((produto) => (
                          <option key={produto.produto_id} value={produto.produto_id}>
                            {produto.descricao}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={createActivityMutation.isPending || !activityData || !activityOcorrenciaId || !activityProdutoId}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: createActivityMutation.isPending || !activityData || !activityOcorrenciaId || !activityProdutoId ? 'not-allowed' : 'pointer',
                        opacity: createActivityMutation.isPending || !activityData || !activityOcorrenciaId || !activityProdutoId ? 0.6 : 1,
                        whiteSpace: 'nowrap',
                        height: 'fit-content',
                      }}
                    >
                      {createActivityMutation.isPending ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Lista de atividades */}
              <div className="occurrences-list">
                <h3>Atividades</h3>
                {isLoadingActivities ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>
                ) : activities.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                    Nenhuma atividade encontrada
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Data</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Ação</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Produto</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Inserido por</th>
                          <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activities.map((activity) => (
                          <tr key={activity.lead_ocorrencia_id}>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
                              {formatActivityDate(activity.data)}
                            </td>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
                              {activity.ocorrencia?.descricao || '-'}
                            </td>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
                              {activity.produto?.descricao || '-'}
                            </td>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
                              {activity.created_at_usuario?.nome || '-'}
                            </td>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                              {canDeleteActivity(activity) && (
                                <button
                                  onClick={() => {
                                    if (confirm('Tem certeza que deseja excluir esta atividade?')) {
                                      deleteActivityMutation.mutate(activity.lead_ocorrencia_id)
                                    }
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '0.25rem',
                                    color: '#e74c3c',
                                  }}
                                  title="Excluir atividade"
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  </svg>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

