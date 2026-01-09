import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { Lead, FilterLeadsDto } from '../types/lead'
import { useAuth } from '../contexts/AuthContext'
import OccurrencesModal from '../components/OccurrencesModal'
import EditLeadModal from '../components/EditLeadModal'
import FiltersModal from '../components/FiltersModal'
import './LeadsList.css'

const STORAGE_KEY_FILTERS = 'leads-filters'

export default function LeadsList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  // Carrega filtros do localStorage na inicialização
  const [filters, setFilters] = useState<FilterLeadsDto>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_FILTERS)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return {}
      }
    }
    return {}
  })
  
  const [agentes, setAgentes] = useState<any[]>([])
  const [colaboradores, setColaboradores] = useState<any[]>([])
  const [showImportModal, setShowImportModal] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [showOccurrencesModal, setShowOccurrencesModal] = useState(false)
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null)
  const [idInicial, setIdInicial] = useState<string>('')
  const [idFinal, setIdFinal] = useState<string>('')
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Salva filtros no localStorage quando mudarem
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(filters))
  }, [filters])
  
  // Busca o maior ID cadastrado para referência na importação
  const { data: maxIdData } = useQuery<{ maxId: number }>({
    queryKey: ['leads', 'max-id'],
    queryFn: async () => {
      const response = await api.get('/leads/max-id')
      return response.data
    },
    enabled: showImportModal, // Só busca quando o modal está aberto
    refetchOnWindowFocus: false,
  })

  const maxId = maxIdData?.maxId || 0
  
  // Verificar se há filtros ativos (exceto nome_razao_social que é unificado com busca rápida)
  const hasActiveFilters = Boolean(
    filters.uf ||
    filters.vendedor_id ||
    filters.usuario_id_colaborador ||
    filters.origem_lead ||
    (filters.produtos && filters.produtos.length > 0)
  )

  // Busca lista de agentes (para filtro, apenas Admin)
  useEffect(() => {
    if (user?.perfil === 'ADMIN') {
      api.get('/users/agentes').then((res) => setAgentes(res.data))
    }
  }, [user])

  // Busca lista de colaboradores (para filtro, Agente)
  useEffect(() => {
    if (user?.perfil === 'AGENTE') {
      api.get('/users/colaboradores').then((res) => setColaboradores(res.data))
    }
  }, [user])

  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 100

  // Query para buscar leads com paginação
  const { data: leadsData, isLoading, error: leadsError, refetch } = useQuery<{
    data: Lead[]
    total: number
    page: number
    limit: number
    totalPages: number
  }>({
    queryKey: ['leads', filters, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.nome_razao_social) {
        params.append('nome_razao_social', filters.nome_razao_social)
      }
      if (filters.uf) {
        params.append('uf', filters.uf)
      }
      if (filters.vendedor_id) {
        params.append('vendedor_id', filters.vendedor_id)
      }
      if (filters.usuario_id_colaborador) {
        params.append('usuario_id_colaborador', filters.usuario_id_colaborador.toString())
      }
      if (filters.produtos && filters.produtos.length > 0) {
        filters.produtos.forEach(produtoId => {
          params.append('produtos', produtoId.toString())
        })
      }
      params.append('page', currentPage.toString())
      params.append('limit', pageSize.toString())

      const response = await api.get(`/leads?${params.toString()}`)
      console.log('[LeadsList] Response:', response.data)
      console.log('[LeadsList] Total de leads recebidos:', response.data?.data?.length || 0)
      console.log('[LeadsList] Total no banco:', response.data?.total || 0)
      console.log('[LeadsList] Limit aplicado:', response.data?.limit || 0)
      console.log('[LeadsList] Página atual:', response.data?.page || 0)
      return response.data
    },
    retry: 1,
  })

  const leads = leadsData?.data || []
  const totalPages = leadsData?.totalPages || 0
  const total = leadsData?.total || 0

  // Debug: log dos dados recebidos
  useEffect(() => {
    if (leadsData) {
      console.log('[LeadsList] LeadsData:', leadsData)
      console.log('[LeadsList] Leads:', leads)
      console.log('[LeadsList] Total:', total)
    }
  }, [leadsData, leads, total])

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return

    try {
      await api.delete(`/leads/${id}`)
      refetch()
      toast.success('Lead excluído com sucesso!')
    } catch (error) {
      // Erro já é tratado pelo interceptor do axios
      console.error('Erro ao excluir lead:', error)
    }
  }

  // Mutation para importar planilha
  const importMutation = useMutation({
    mutationFn: async ({ file, idInicial, idFinal }: { file: File; idInicial: string; idFinal: string }) => {
      const formData = new FormData()
      formData.append('file', file)
      // Valida e converte ID inicial (se preenchido)
      if (idInicial.trim()) {
        const idInicialNum = parseInt(idInicial.trim(), 10)
        if (!isNaN(idInicialNum) && idInicialNum > 0) {
          formData.append('idInicial', idInicialNum.toString())
        }
      }
      // Valida e converte ID final (se preenchido)
      if (idFinal.trim()) {
        const idFinalNum = parseInt(idFinal.trim(), 10)
        if (!isNaN(idFinalNum) && idFinalNum > 0) {
          formData.append('idFinal', idFinalNum.toString())
        }
      }
      const response = await api.post('/leads/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 600000, // 10 minutos de timeout para importação (arquivos grandes podem demorar)
      })
      return response.data
    },
    onSuccess: (data) => {
      setImportResult({
        success: data.importedCount || 0,
        error: null,
        idsIgnorados: data.idsIgnorados || 0,
      })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    onError: (error: any) => {
      // Verifica se é erro de timeout ou rede
      const isNetworkError = error.code === 'ECONNABORTED' || 
                            error.message?.includes('timeout') ||
                            error.message?.includes('Network Error') ||
                            !error.response;
      
      if (isNetworkError) {
        setImportResult({
          success: 0,
          error: {
            erro: 'Erro de conexão ou timeout',
            detalhes: 'A importação pode ter sido concluída no servidor, mas a resposta não foi recebida a tempo. Verifique se os leads foram importados na lista. Se o problema persistir, tente importar um arquivo menor ou verifique sua conexão.',
          },
        })
        // Mesmo com erro de rede, invalida queries para atualizar a lista (pode ter sido importado)
        queryClient.invalidateQueries({ queryKey: ['leads'] })
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }
      
      // Se o erro contém informações de linha e ID, exibe de forma formatada
      const errorData = error.response?.data?.message || error.response?.data
      
      // Erro de estrutura da planilha (colunas faltantes)
      if (errorData && typeof errorData === 'object' && errorData.colunasFaltantes) {
        setImportResult({
          success: 0,
          error: {
            erro: errorData.erro || 'Estrutura da planilha incompleta',
            detalhes: errorData.detalhes,
            colunasFaltantes: errorData.colunasFaltantes,
            colunasObrigatorias: errorData.colunasObrigatorias,
            colunasEncontradas: errorData.colunasEncontradas,
          },
        })
      } 
      // Erro de linha específica
      else if (errorData && typeof errorData === 'object' && errorData.linha) {
        setImportResult({
          success: 0,
          error: {
            linha: errorData.linha,
            id: errorData.id || 'N/A',
            erro: errorData.erro || errorData.message || 'Erro ao importar planilha',
            linhasImportadas: errorData.linhasImportadas || 0,
          },
        })
      } 
      // Erro genérico
      else {
        setImportResult({
          success: 0,
          error: {
            erro: errorData?.erro || errorData?.message || error.message || 'Erro ao importar planilha',
            detalhes: errorData?.detalhes,
          },
        })
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Valida extensão
      const validExtensions = ['.xlsx', '.xls', '.csv']
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!validExtensions.includes(fileExt)) {
        toast.warning('Apenas arquivos Excel (.xlsx, .xls) ou CSV são permitidos')
        return
      }
      // Valida tamanho (50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.warning('Arquivo muito grande. Tamanho máximo: 50MB')
        return
      }
      importMutation.mutate({ file, idInicial, idFinal })
    }
  }

  return (
    <div className="leads-list">
      <div className="page-header">
        <h1>Leads</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Botão Filtros (sempre visível) */}
          <button
            onClick={() => setShowFiltersModal(true)}
            className="btn-filters"
            style={{ 
              backgroundColor: hasActiveFilters ? '#3498db' : '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
              padding: '8px 16px',
              position: 'relative'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            <span className="btn-filters-text">Filtros</span>
            {hasActiveFilters && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: '#ff6b35',
                borderRadius: '50%',
                width: '12px',
                height: '12px',
                border: '2px solid white'
              }} />
            )}
          </button>
          {/* Campo de busca rápida */}
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={filters.nome_razao_social || ''}
            onChange={(e) =>
              setFilters({ ...filters, nome_razao_social: e.target.value || undefined })
            }
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              minWidth: '200px'
            }}
          />
          <button
            onClick={() => setShowImportModal(true)}
            className="btn-import"
            style={{ backgroundColor: '#27ae60', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span className="btn-import-text">Importar</span>
          </button>
          <button 
            onClick={() => navigate('/leads/novo')} 
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span className="btn-new-lead-text">Novo Lead</span>
          </button>
        </div>
      </div>

      {/* Modal de Filtros */}
      <FiltersModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        filters={filters}
        onFiltersChange={setFilters}
        onApply={() => {
          // Filtros já foram atualizados via onFiltersChange
          setCurrentPage(1)
        }}
        onClear={() => {
          setFilters({})
          setCurrentPage(1)
        }}
        agentes={agentes}
        colaboradores={colaboradores}
        isAdmin={user?.perfil === 'ADMIN'}
        isAgente={user?.perfil === 'AGENTE'}
      />

      {isLoading ? (
        <div>Carregando...</div>
      ) : leadsError ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#e74c3c' }}>
          <p>Erro ao carregar leads. Tente novamente.</p>
          <button onClick={() => refetch()} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>Total de leads: {total}</strong> | Página {currentPage} de {totalPages || 1}
            </div>
          </div>

          {/* Cards para Mobile */}
          <div className="leads-cards">
            {leads.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#7f8c8d' }}>
                Nenhum lead encontrado
              </div>
            ) : (
              leads.map((lead) => {
                const isExpanded = expandedCardId === lead.id
                return (
                  <div key={lead.id} className="lead-card">
                    {/* Versão Mobile: Compacta + Expansível */}
                    <div className="lead-card-mobile">
                      {/* Seção Compacta - Sempre Visível */}
                      <div className="lead-card-compact">
                        <div className="lead-card-compact-header">
                          <div className="lead-card-field-compact">
                            <span className="lead-card-label-compact">Nome</span>
                            <span className="lead-card-value-compact">{lead.nome_razao_social}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedCardId(isExpanded ? null : lead.id)
                            }}
                            className="lead-card-expand-btn"
                            aria-label={isExpanded ? "Recolher" : "Expandir"}
                          >
                            <svg 
                              width="20" 
                              height="20" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                              style={{
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.3s ease'
                              }}
                            >
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                          </button>
                        </div>
                        <div className="lead-card-compact-content">
                          {user?.perfil === 'ADMIN' && (
                            <div className="lead-card-field-compact">
                              <span className="lead-card-label-compact">Vendedor</span>
                              <span className="lead-card-value-compact">{lead.vendedor?.nome || '-'}</span>
                            </div>
                          )}
                          <div className="lead-card-field-compact">
                            <span className="lead-card-label-compact">Colaborador</span>
                            <span className="lead-card-value-compact">{lead.colaborador?.nome || '-'}</span>
                          </div>
                          <div className="lead-card-field-compact">
                            <span className="lead-card-label-compact">Situação</span>
                            <span className="lead-card-value-compact" style={{ 
                              color: lead.kanbanStatus?.text_color || lead.kanbanStatus?.bg_color || '#7f8c8d',
                              fontWeight: '600'
                            }}>
                              {lead.kanbanStatus?.descricao || '-'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Seção Expandível - Campos Adicionais */}
                      <div className={`lead-card-expandable ${isExpanded ? 'expanded' : ''}`}>
                        <div className="lead-card-body">
                          <div className="lead-card-field">
                            <span className="lead-card-label">ID</span>
                            <span className="lead-card-value">{lead.id}</span>
                          </div>
                          <div className="lead-card-field">
                            <span className="lead-card-label">Data Entrada</span>
                            <span className="lead-card-value">{new Date(lead.data_entrada).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="lead-card-field">
                            <span className="lead-card-label">Telefone</span>
                            <span className="lead-card-value">{lead.telefone || '-'}</span>
                          </div>
                          <div className="lead-card-field">
                            <span className="lead-card-label">Email</span>
                            <span className="lead-card-value">{lead.email || '-'}</span>
                          </div>
                          <div className="lead-card-field">
                            <span className="lead-card-label">UF</span>
                            <span className="lead-card-value">{lead.uf || '-'}</span>
                          </div>
                          <div className="lead-card-field">
                            <span className="lead-card-label">Município</span>
                            <span className="lead-card-value">{lead.municipio || '-'}</span>
                          </div>
                          {lead.anotacoes && (
                            <div className="lead-card-field" style={{ gridColumn: '1 / -1' }}>
                              <span className="lead-card-label">Anotações</span>
                              <span className="lead-card-value">{lead.anotacoes}</span>
                            </div>
                          )}
                        </div>
                        <div className="lead-card-actions-expanded">
                          <button
                            onClick={() => {
                              setSelectedLeadId(lead.id)
                              setShowOccurrencesModal(true)
                            }}
                            className="btn-secondary"
                            style={{ flex: 1 }}
                          >
                            Ver Ocorrências
                          </button>
                          <button
                            onClick={() => setEditingLead(lead)}
                            className="btn-primary"
                            style={{ flex: 1 }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(lead.id.toString())}
                            className="btn-delete"
                            style={{ flex: 1 }}
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Versão Desktop: Todos os campos visíveis */}
                    <div className="lead-card-desktop">
                      <div className="lead-card-header">
                        <h3 className="lead-card-title">{lead.nome_razao_social}</h3>
                        <div className="lead-card-actions">
                          <button
                            onClick={() => {
                              setSelectedLeadId(lead.id)
                              setShowOccurrencesModal(true)
                            }}
                            className="btn-icon"
                            title="Ver ocorrências"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(lead.id.toString())}
                            className="btn-icon"
                            title="Excluir lead"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#dc3545',
                            }}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="lead-card-body">
                        <div className="lead-card-field">
                          <span className="lead-card-label">ID</span>
                          <span className="lead-card-value">{lead.id}</span>
                        </div>
                        <div className="lead-card-field">
                          <span className="lead-card-label">Data Entrada</span>
                          <span className="lead-card-value">{new Date(lead.data_entrada).toLocaleDateString('pt-BR')}</span>
                        </div>
                        {user?.perfil === 'ADMIN' && (
                          <div className="lead-card-field">
                            <span className="lead-card-label">Vendedor</span>
                            <span className="lead-card-value">{lead.vendedor?.nome || '-'}</span>
                          </div>
                        )}
                        <div className="lead-card-field">
                          <span className="lead-card-label">Colaborador</span>
                          <span className="lead-card-value">{lead.colaborador?.nome || '-'}</span>
                        </div>
                        <div className="lead-card-field">
                          <span className="lead-card-label">Situação</span>
                          <span className="lead-card-value">{lead.kanbanStatus?.descricao || '-'}</span>
                        </div>
                        <div className="lead-card-field">
                          <span className="lead-card-label">Telefone</span>
                          <span className="lead-card-value">{lead.telefone || '-'}</span>
                        </div>
                        <div className="lead-card-field">
                          <span className="lead-card-label">Email</span>
                          <span className="lead-card-value">{lead.email || '-'}</span>
                        </div>
                        <div className="lead-card-field">
                          <span className="lead-card-label">UF</span>
                          <span className="lead-card-value">{lead.uf || '-'}</span>
                        </div>
                        <div className="lead-card-field">
                          <span className="lead-card-label">Município</span>
                          <span className="lead-card-value">{lead.municipio || '-'}</span>
                        </div>
                        {lead.anotacoes && (
                          <div className="lead-card-field" style={{ gridColumn: '1 / -1' }}>
                            <span className="lead-card-label">Anotações</span>
                            <span className="lead-card-value">{lead.anotacoes}</span>
                          </div>
                        )}
                      </div>
                      <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #eee' }}>
                        <button
                          onClick={() => setEditingLead(lead)}
                          className="btn-edit"
                          style={{ width: '100%' }}
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Tabela para Desktop */}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Data Entrada</th>
                  <th>Nome/Razão Social</th>
                  {user?.perfil === 'ADMIN' && <th>Vendedor</th>}
                  <th>Colaborador</th>
                  <th>Situação</th>
                  <th>Telefone</th>
                  <th>Email</th>
                  <th>UF</th>
                  <th>Município</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={user?.perfil === 'ADMIN' ? 12 : 11}>
                      Nenhum lead encontrado
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <>
                      <tr 
                        key={lead.id}
                        onClick={() => setEditingLead(lead)}
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f5f5f5'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <td style={{ fontSize: '0.85rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {lead.id}
                        </td>
                        <td>{new Date(lead.data_entrada).toLocaleDateString('pt-BR')}</td>
                        <td>{lead.nome_razao_social}</td>
                        {user?.perfil === 'ADMIN' && (
                          <td>{lead.vendedor?.nome || '-'}</td>
                        )}
                        <td>{lead.colaborador?.nome || '-'}</td>
                        <td>{lead.kanbanStatus?.descricao || '-'}</td>
                        <td>{lead.telefone || '-'}</td>
                        <td>{lead.email || '-'}</td>
                        <td>{lead.uf || '-'}</td>
                        <td>{lead.municipio || '-'}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                              onClick={() => {
                                setSelectedLeadId(lead.id)
                                setShowOccurrencesModal(true)
                              }}
                              className="btn-icon"
                              title="Ver ocorrências"
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(lead.id.toString())}
                              className="btn-icon"
                              title="Excluir lead"
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#dc3545',
                              }}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {lead.anotacoes && (
                        <tr key={`${lead.id}-anotacoes`}>
                          <td colSpan={user?.perfil === 'ADMIN' ? 12 : 11} style={{ 
                            padding: '0.5rem 1rem', 
                            backgroundColor: '#f9f9f9',
                            borderTop: 'none',
                            fontSize: '0.9rem',
                            color: '#666'
                          }}>
                            <strong>Anotações:</strong> {lead.anotacoes}
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Controles de Paginação */}
          {totalPages > 1 && (
            <div className="pagination-controls" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn-secondary"
                style={{ padding: '0.5rem 1rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
              >
                Anterior
              </button>
              <span>
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="btn-secondary"
                style={{ padding: '0.5rem 1rem', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de Importação */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => {
          setShowImportModal(false)
          setImportResult(null)
          setIdInicial('')
          setIdFinal('')
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Importar Leads via Planilha</h2>
            <p style={{ marginBottom: '1rem', color: '#7f8c8d' }}>
              Selecione um arquivo Excel (.xlsx, .xls) ou CSV (.csv) com os leads.
              Tamanho máximo: 50MB
            </p>

            {/* Informação sobre o maior ID cadastrado */}
            {maxId > 0 && (
              <div style={{ 
                marginBottom: '1rem', 
                padding: '0.75rem', 
                backgroundColor: '#e7f3ff', 
                borderRadius: '4px',
                border: '1px solid #b3d9ff'
              }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#004085' }}>
                  <strong>📋 Referência:</strong> O maior ID já cadastrado é <strong>{maxId}</strong>.
                  <br />
                  <span style={{ fontSize: '0.85rem' }}>
                    Use IDs maiores que {maxId} na sua planilha para evitar conflitos.
                  </span>
                </p>
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                ID inicial para importação (opcional):
              </label>
              <input
                type="text"
                value={idInicial}
                onChange={(e) => {
                  setIdInicial(e.target.value)
                }}
                placeholder="Deixe vazio para importar todos os IDs"
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
                disabled={importMutation.isPending}
              />
              <p style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#7f8c8d' }}>
                Informe o menor ID a ser importado. Apenas leads com ID maior ou igual a este valor serão importados.
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                ID final para importação (opcional):
              </label>
              <input
                type="text"
                value={idFinal}
                onChange={(e) => {
                  setIdFinal(e.target.value)
                }}
                placeholder="Deixe vazio para importar todos os IDs"
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
                disabled={importMutation.isPending}
              />
              <p style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#7f8c8d' }}>
                Informe o maior ID a ser importado. Apenas leads com ID menor ou igual a este valor serão importados.
                Se ambos os campos estiverem vazios, todos os leads da planilha serão importados.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              style={{ marginBottom: '1rem', width: '100%' }}
              disabled={importMutation.isPending}
            />

            {importMutation.isPending && (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <p>Processando arquivo...</p>
              </div>
            )}

            {importResult && (
              <div style={{ marginTop: '1rem' }}>
                {importResult.success > 0 && (
                  <div
                    style={{
                      padding: '1rem',
                      backgroundColor: '#d4edda',
                      borderRadius: '4px',
                      marginBottom: '1rem',
                    }}
                  >
                    <strong>✅ {importResult.success} leads importados com sucesso!</strong>
                  </div>
                )}

                {importResult.idsIgnorados > 0 && (
                  <div
                    style={{
                      padding: '1rem',
                      backgroundColor: '#fff3cd',
                      borderRadius: '4px',
                      marginBottom: '1rem',
                      border: '1px solid #ffc107',
                    }}
                  >
                    <strong style={{ color: '#856404' }}>
                      ⚠️ IDs encontrados e não importados/atualizados: {importResult.idsIgnorados}
                    </strong>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#856404' }}>
                      Estes IDs já existem no banco de dados e foram ignorados durante a importação.
                    </div>
                  </div>
                )}

                {importResult.error && (
                  <div
                    style={{
                      padding: '1rem',
                      backgroundColor: '#f8d7da',
                      borderRadius: '4px',
                      border: '1px solid #f5c6cb',
                    }}
                  >
                    {/* Erro de estrutura da planilha */}
                    {importResult.error.colunasFaltantes && (
                      <>
                        <strong style={{ color: '#721c24', display: 'block', marginBottom: '0.5rem' }}>
                          ⚠️ Estrutura da planilha incompleta
                        </strong>
                        <div style={{ marginTop: '0.5rem', color: '#721c24' }}>
                          <div style={{ marginBottom: '0.5rem' }}>
                            <strong>Erro:</strong> {importResult.error.erro || importResult.error.detalhes}
                          </div>
                          <div style={{ marginBottom: '0.5rem' }}>
                            <strong>Colunas obrigatórias faltantes:</strong>
                            <ul style={{ marginTop: '0.25rem', marginLeft: '1.5rem' }}>
                              {importResult.error.colunasFaltantes.map((col: string, idx: number) => (
                                <li key={idx}>{col}</li>
                              ))}
                            </ul>
                          </div>
                          <div style={{ marginBottom: '0.5rem', padding: '0.75rem', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
                            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Colunas obrigatórias:</strong>
                            <ul style={{ margin: '0.25rem 0 0 1.5rem' }}>
                              {importResult.error.colunasObrigatorias?.map((col: string, idx: number) => (
                                <li key={idx}>{col}</li>
                              ))}
                            </ul>
                          </div>
                          {importResult.error.colunasEncontradas && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                              <strong>Colunas encontradas na planilha:</strong> {importResult.error.colunasEncontradas.join(', ')}
                            </div>
                          )}
                          <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#d1ecf1', borderRadius: '4px', fontSize: '0.9rem' }}>
                            <strong>💡 Instruções:</strong>
                            <ol style={{ marginTop: '0.25rem', marginLeft: '1.5rem' }}>
                              <li>Verifique se todas as colunas obrigatórias estão presentes na primeira linha da planilha</li>
                              <li>Os nomes das colunas podem ter variações (ex: "Nome" ou "LEAD", "E-mail" ou "Email")</li>
                              <li>Certifique-se de que a primeira linha contém os cabeçalhos das colunas</li>
                              <li>Corrija a planilha e tente importar novamente</li>
                            </ol>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {/* Erro de linha específica */}
                    {!importResult.error.colunasFaltantes && importResult.error.linha && (
                      <>
                        <strong style={{ color: '#721c24' }}>⚠️ Importação interrompida na linha {importResult.error.linha}</strong>
                        <div style={{ marginTop: '0.5rem', color: '#721c24' }}>
                          {importResult.error.linhasImportadas > 0 && (
                            <div style={{ marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: '#d4edda', borderRadius: '4px' }}>
                              <strong style={{ color: '#155724' }}>✅ {importResult.error.linhasImportadas} linha(s) importada(s) com sucesso antes do erro</strong>
                            </div>
                          )}
                          <div>
                            <strong>ID:</strong> {importResult.error.id !== 'N/A' ? importResult.error.id : 'Não informado'}
                          </div>
                          <div style={{ marginTop: '0.25rem' }}>
                            <strong>Erro:</strong> {importResult.error.erro}
                          </div>
                          <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#856404' }}>
                            💡 Corrija o erro na planilha e tente importar novamente. {importResult.error.linhasImportadas > 0 ? 'As linhas anteriores já foram importadas.' : 'Nenhuma linha foi importada antes do erro.'}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Erro genérico */}
                    {!importResult.error.colunasFaltantes && !importResult.error.linha && (
                      <div style={{ color: '#721c24' }}>
                        <strong>Erro:</strong> {importResult.error.erro || importResult.error.message || 'Erro desconhecido ao processar a importação'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                onClick={() => {
          setShowImportModal(false)
          setImportResult(null)
          setIdInicial('')
          setIdFinal('')
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                className="btn-secondary"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {editingLead && (
        <div className="modal-overlay" onClick={() => setEditingLead(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
            <EditLeadModal
              lead={editingLead}
              onClose={() => setEditingLead(null)}
              onSuccess={() => {
                setEditingLead(null)
                refetch()
              }}
            />
          </div>
        </div>
      )}

      {/* Modal de Ocorrências */}
      {showOccurrencesModal && selectedLeadId && (
        <OccurrencesModal
          leadId={selectedLeadId}
          leadName={leads.find(l => l.id === selectedLeadId)?.nome_razao_social}
          onClose={() => {
            setShowOccurrencesModal(false)
            setSelectedLeadId(null)
          }}
        />
      )}
    </div>
  )
}





