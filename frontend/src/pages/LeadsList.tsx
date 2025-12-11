import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { Lead, FilterLeadsDto, LeadStatus, CreateLeadDto, ItemInteresse } from '../types/lead'
import { useAuth } from '../contexts/AuthContext'
import './LeadsList.css'

export default function LeadsList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<FilterLeadsDto>({})
  const [agentes, setAgentes] = useState<any[]>([])
  const [showImportModal, setShowImportModal] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Busca lista de agentes (para filtro, apenas Admin)
  useEffect(() => {
    if (user?.perfil === 'ADMIN') {
      api.get('/users/agentes').then((res) => setAgentes(res.data))
    }
  }, [user])

  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 100

  // Query para buscar leads com paginação
  const { data: leadsData, isLoading, refetch } = useQuery<{
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
      if (filters.status) {
        params.append('status', filters.status)
      }
      if (filters.uf) {
        params.append('uf', filters.uf)
      }
      if (filters.vendedor_id) {
        params.append('vendedor_id', filters.vendedor_id)
      }
      params.append('page', currentPage.toString())
      params.append('limit', pageSize.toString())

      const response = await api.get(`/leads?${params.toString()}`)
      return response.data
    },
  })

  const leads = leadsData?.data || []
  const totalPages = leadsData?.totalPages || 0
  const total = leadsData?.total || 0

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return

    try {
      await api.delete(`/leads/${id}`)
      refetch()
    } catch (error) {
      alert('Erro ao excluir lead')
    }
  }

  // Mutation para importar planilha
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const response = await api.post('/leads/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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
      // Se o erro contém informações de linha e ID, exibe de forma formatada
      const errorData = error.response?.data?.message || error.response?.data
      
      if (errorData && typeof errorData === 'object' && errorData.linha) {
        setImportResult({
          success: 0,
          error: {
            linha: errorData.linha,
            id: errorData.id || 'N/A',
            erro: errorData.erro || errorData.message || 'Erro ao importar planilha',
          },
        })
      } else {
        alert(errorData || 'Erro ao importar planilha')
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
        alert('Apenas arquivos Excel (.xlsx, .xls) ou CSV são permitidos')
        return
      }
      // Valida tamanho (50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert('Arquivo muito grande. Tamanho máximo: 50MB')
        return
      }
      importMutation.mutate(file)
    }
  }

  const formatStatus = (status: LeadStatus) => {
    const labels: Record<LeadStatus, string> = {
      NAO_ATENDEU: 'Não Atendeu',
      NAO_E_MOMENTO: 'Não é o Momento',
      TEM_INTERESSE: 'Tem Interesse',
      NAO_TEM_INTERESSE: 'Não Tem Interesse',
      TELEFONE_INVALIDO: 'Telefone Inválido',
      LEAD_QUENTE: 'Lead Quente',
      RETORNO_AGENDADO: 'Retorno Agendado',
      NAO_E_PECUARISTA: 'Não é Pecuarista',
      AGUARDANDO_OFERTAS: 'Aguardando Ofertas',
    }
    return labels[status] || status
  }

  return (
    <div className="leads-list">
      <div className="page-header">
        <h1>Leads</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowImportModal(true)}
            className="btn-import"
            style={{ backgroundColor: '#27ae60', whiteSpace: 'nowrap'}}
          >
            📥 Importar Planilha
          </button>
          <button onClick={() => navigate('/leads/novo')} className="btn-primary">
            Novo Lead
          </button>
        </div>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Nome/Razão Social</label>
          <input
            type="text"
            value={filters.nome_razao_social || ''}
            onChange={(e) =>
              setFilters({ ...filters, nome_razao_social: e.target.value || undefined })
            }
            placeholder="Buscar por nome..."
          />
        </div>

        <div className="filter-group">
          <label>Status</label>
          <select
            value={filters.status || ''}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value ? (e.target.value as LeadStatus) : undefined })
            }
          >
            <option value="">Todos</option>
            {Object.values(LeadStatus).map((status) => (
              <option key={status} value={status}>
                {formatStatus(status)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>UF</label>
          <select
            value={filters.uf || ''}
            onChange={(e) =>
              setFilters({ ...filters, uf: e.target.value || undefined })
            }
          >
            <option value="">Todas</option>
            {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </div>

        {user?.perfil === 'ADMIN' && (
          <div className="filter-group">
            <label>Vendedor</label>
            <select
              value={filters.vendedor_id || ''}
              onChange={(e) =>
                setFilters({ ...filters, vendedor_id: e.target.value || undefined })
              }
            >
              <option value="">Todos</option>
              {agentes.map((agente) => (
                <option key={agente.id} value={agente.id}>
                  {agente.nome}
                </option>
              ))}
            </select>
          </div>
        )}
<div className="filter-group">
<label>Limpar filtro</label>
        <button 
          onClick={() => setFilters({})} 
          className="btn-secondary"
          title="Limpar filtros"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '0.5rem',
            minWidth: '40px',
            width: '40px'
          }}
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
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
</div>
      {isLoading ? (
        <div>Carregando...</div>
      ) : (
        <div className="table-container">
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>Total de leads: {total}</strong> | Página {currentPage} de {totalPages || 1}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Data Entrada</th>
                  <th>Nome/Razão Social</th>
                  <th>Telefone</th>
                  <th>Email</th>
                  <th>UF</th>
                  <th>Município</th>
                  <th>Status</th>
                  <th>Itens Interesse</th>
                  {user?.perfil === 'ADMIN' && <th>Vendedor</th>}
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={user?.perfil === 'ADMIN' ? 10 : 9}>
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
                        <td>{lead.telefone || '-'}</td>
                        <td>{lead.email || '-'}</td>
                        <td>{lead.uf || '-'}</td>
                        <td>{lead.municipio || '-'}</td>
                        <td>
                          {lead.status?.length
                            ? lead.status.map((s) => formatStatus(s)).join(', ')
                            : '-'}
                        </td>
                        <td>
                          {lead.itens_interesse?.length
                            ? lead.itens_interesse.map((i) => i).join(', ')
                            : '-'}
                        </td>
                        {user?.perfil === 'ADMIN' && (
                          <td>{lead.vendedor?.nome || '-'}</td>
                        )}
                        <td onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleDelete(lead.id)}
                            className="btn-delete"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                      {lead.anotacoes && (
                        <tr key={`${lead.id}-anotacoes`}>
                          <td colSpan={user?.perfil === 'ADMIN' ? 10 : 9} style={{ 
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
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
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
        </div>
      )}

      {/* Modal de Importação */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => {
          setShowImportModal(false)
          setImportResult(null)
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Importar Leads via Planilha</h2>
            <p style={{ marginBottom: '1rem', color: '#7f8c8d' }}>
              Selecione um arquivo Excel (.xlsx, .xls) ou CSV (.csv) com os leads.
              Tamanho máximo: 50MB
            </p>

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
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setImportResult(null)
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
    </div>
  )
}

// Componente de Modal de Edição
function EditLeadModal({ lead, onClose, onSuccess }: { lead: Lead; onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [agentes, setAgentes] = useState<any[]>([])
  const [formData, setFormData] = useState<CreateLeadDto>({
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

  useEffect(() => {
    api.get('/users/agentes').then((res) => setAgentes(res.data))
  }, [])

  const mutation = useMutation({
    mutationFn: async (data: CreateLeadDto) => {
      return api.patch(`/leads/${lead.id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      onSuccess()
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
    <div>
      <h2>Editar Lead</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label>Data de Entrada *</label>
            <input
              type="date"
              value={formData.data_entrada || new Date().toISOString().split('T')[0]}
              onChange={(e) => setFormData({ ...formData, data_entrada: e.target.value })}
              required
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          </div>

          <div>
            <label>Vendedor *</label>
            <select
              value={formData.vendedor_id}
              onChange={(e) => setFormData({ ...formData, vendedor_id: e.target.value })}
              required
              disabled={user?.perfil === 'AGENTE'}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
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

        <div>
          <label>Nome/Razão Social *</label>
          <input
            type="text"
            value={formData.nome_razao_social}
            onChange={(e) => setFormData({ ...formData, nome_razao_social: e.target.value })}
            required
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label>UF *</label>
            <input
              type="text"
              maxLength={2}
              value={formData.uf}
              onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
              required
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          </div>

          <div>
            <label>Município *</label>
            <input
              type="text"
              value={formData.municipio}
              onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
              required
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          </div>
        </div>

        <div>
          <label>Status (multiselect)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
            {Object.values(LeadStatus).map((status) => (
              <label key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.status?.includes(status) || false}
                  onChange={(e) => handleStatusChange(status, e.target.checked)}
                />
                <span>{formatLabel(status)}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label>Itens de Interesse (multiselect)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
            {Object.values(ItemInteresse).map((item) => (
              <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.itens_interesse?.includes(item) || false}
                  onChange={(e) => handleItemInteresseChange(item, e.target.checked)}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label>Anotações</label>
          <textarea
            value={formData.anotacoes || ''}
            onChange={(e) => setFormData({ ...formData, anotacoes: e.target.value })}
            rows={5}
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




