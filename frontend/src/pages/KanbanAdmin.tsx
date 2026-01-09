import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { BoardWithLeadsCount, CreateKanbanBoardDto, KanbanBoardType, MoveLeadDto } from '../types/kanban-board'
import { Lead, FilterLeadsDto } from '../types/lead'
import OccurrencesModal from '../components/OccurrencesModal'
import EditLeadModal from '../components/EditLeadModal'
import ScheduleContactModal from '../components/ScheduleContactModal'
import AppointmentBadge from '../components/AppointmentBadge'
import FiltersModal from '../components/FiltersModal'
import './KanbanAdmin.css'

const STORAGE_KEY_FILTERS = 'kanban-admin-filters'

export default function KanbanAdmin() {
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)
  const [draggedFromBoardId, setDraggedFromBoardId] = useState<number | null>(null)
  const [selectedLeadForOccurrences, setSelectedLeadForOccurrences] = useState<Lead | null>(null)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [selectedLeadForSchedule, setSelectedLeadForSchedule] = useState<Lead | null>(null)
  const [openMenuLeadId, setOpenMenuLeadId] = useState<number | null>(null)
  const [formData, setFormData] = useState<CreateKanbanBoardDto>({
    nome: '',
    cor_hex: '#ADF0C7',
    tipo: KanbanBoardType.ADMIN,
    agente_id: undefined,
    kanban_modelo_id: undefined,
  })
  const [agentes, setAgentes] = useState<any[]>([])
  const [modelos, setModelos] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  
  // Carrega filtros do localStorage na inicialização
  const [filters, setFilters] = useState<FilterLeadsDto>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_FILTERS)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Sincroniza nome_razao_social com searchTerm
        if (parsed.nome_razao_social) {
          setSearchTerm(parsed.nome_razao_social)
        }
        return parsed
      } catch {
        return {}
      }
    }
    return {}
  })
  
  // Salva filtros no localStorage quando mudarem
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(filters))
  }, [filters])
  
  // Sincroniza searchTerm com filters.nome_razao_social (apenas quando searchTerm mudar)
  useEffect(() => {
    if (searchTerm !== (filters.nome_razao_social || '')) {
      setFilters(prev => ({ ...prev, nome_razao_social: searchTerm || undefined }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])
  
  // Verificar se há filtros ativos (exceto nome_razao_social)
  const hasActiveFilters = Boolean(
    filters.uf ||
    filters.vendedor_id ||
    filters.usuario_id_colaborador ||
    filters.origem_lead ||
    (filters.produtos && filters.produtos.length > 0)
  )
  
  // Verificar se há qualquer filtro ativo (incluindo nome_razao_social)
  const hasAnyFilter = Boolean(
    filters.nome_razao_social ||
    hasActiveFilters
  )

  // Fecha o menu ao clicar fora
  useEffect(() => {
    if (openMenuLeadId === null) return
    
    const handleClickOutside = () => {
      setOpenMenuLeadId(null)
    }
    
    document.addEventListener('click', handleClickOutside)
    
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [openMenuLeadId])

  // Busca agentes e modelos
  useEffect(() => {
    api.get('/users/agentes').then((res) => setAgentes(res.data))
    api.get('/kanban-modelos').then((res) => setModelos(res.data))
  }, [])

  // Busca boards
  const { data: boards = [], isLoading: boardsLoading } = useQuery<BoardWithLeadsCount[]>({
    queryKey: ['kanban-boards-admin'],
    queryFn: async () => {
      const response = await api.get('/kanban-boards/admin')
      return response.data
    },
  })

  // Busca leads de todos os boards automaticamente
  const boardLeadsQueries = useQuery({
    queryKey: ['kanban-board-leads-all', boards.map(b => b.id).sort().join(','), filters, currentPage],
    queryFn: async () => {
      if (boards.length === 0) return {}
      const leadsPromises = boards.map(board => {
        const params = new URLSearchParams()
        params.append('page', currentPage.toString())
        params.append('limit', '50')
        if (filters.nome_razao_social) {
          params.append('nome_razao_social', filters.nome_razao_social)
        }
        if (filters.uf) {
          params.append('uf', filters.uf)
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
        if (filters.produtos && filters.produtos.length > 0) {
          filters.produtos.forEach(produtoId => {
            params.append('produtos', produtoId.toString())
          })
        }
        return api.get(`/kanban-boards/${board.id}/leads?${params.toString()}`)
          .then(res => ({ boardId: board.id, data: res.data }))
          .catch(() => ({ boardId: board.id, data: { data: [], total: 0, page: currentPage, limit: 50 } }))
      })
      const results = await Promise.all(leadsPromises)
      const leadsMap: Record<number, { data: Lead[]; total: number; page: number }> = {}
      
      // Pega dados anteriores do cache
      const previousData = queryClient.getQueryData<Record<number, { data: Lead[]; total: number; page: number }>>(
        ['kanban-board-leads-all', boards.map(b => b.id).sort().join(','), filters, currentPage - 1]
      ) || {}
      
      results.forEach(({ boardId, data }) => {
        if (currentPage === 1) {
          // Página 1: substitui os dados
          leadsMap[boardId] = { 
            data: data.data || [], 
            total: data.total || 0,
            page: data.page || currentPage
          }
        } else {
          // Página > 1: acumula com dados anteriores
          const existingData = previousData[boardId]?.data || []
          leadsMap[boardId] = { 
            data: [...existingData, ...(data.data || [])], 
            total: data.total || 0,
            page: data.page || currentPage
          }
        }
      })
      return leadsMap
    },
    enabled: boards.length > 0,
  })

  const boardLeads = boardLeadsQueries.data || {}

  const createBoardMutation = useMutation({
    mutationFn: async (data: CreateKanbanBoardDto) => {
      return api.post('/kanban-boards', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-boards-admin'] })
      queryClient.invalidateQueries({ queryKey: ['kanban-board-leads-all'] })
      setShowCreateModal(false)
      toast.success('Board criado com sucesso!')
      setFormData({
        nome: '',
        cor_hex: '#ADF0C7',
        tipo: KanbanBoardType.ADMIN,
        agente_id: undefined,
        kanban_modelo_id: undefined,
      })
    },
  })

  const moveLeadMutation = useMutation({
    mutationFn: async ({ leadId, fromBoardId, toBoardId }: { leadId: number; fromBoardId: number; toBoardId: number }) => {
      const moveDto: MoveLeadDto = { from_board_id: fromBoardId, to_board_id: toBoardId }
      return api.post(`/kanban-boards/leads/${leadId}/move`, moveDto)
    },
    onMutate: async (variables) => {
      // Cancela queries em andamento para evitar sobrescrever a atualização otimista
      await queryClient.cancelQueries({ queryKey: ['kanban-board-leads-all'] })
      
      // Snapshot do estado anterior para rollback em caso de erro
      const previousData = queryClient.getQueriesData({ queryKey: ['kanban-board-leads-all'] })
      
      // Atualização otimista - atualiza todas as queries relacionadas
      queryClient.setQueriesData<Record<number, { data: Lead[]; total: number; page: number }>>(
        { queryKey: ['kanban-board-leads-all'] },
        (oldData) => {
          if (!oldData) return oldData
          
          const newData = { ...oldData }
          const lead = newData[variables.fromBoardId]?.data.find(l => l.id === variables.leadId)
          
          if (lead) {
            // Remove do board de origem
            newData[variables.fromBoardId] = {
              ...newData[variables.fromBoardId],
              data: newData[variables.fromBoardId].data.filter(l => l.id !== variables.leadId),
              total: Math.max(0, (newData[variables.fromBoardId]?.total || 0) - 1)
            }
            
            // Adiciona ao board de destino
            if (!newData[variables.toBoardId]) {
              newData[variables.toBoardId] = { data: [], total: 0, page: 1 }
            }
            newData[variables.toBoardId] = {
              ...newData[variables.toBoardId],
              data: [...newData[variables.toBoardId].data, lead],
              total: (newData[variables.toBoardId]?.total || 0) + 1
            }
          }
          
          return newData
        }
      )
      
      return { previousData }
    },
    onSuccess: async () => {
      // Invalida queries de boards e leads
      await queryClient.invalidateQueries({ queryKey: ['kanban-boards-admin'] })
      await queryClient.invalidateQueries({ queryKey: ['kanban-board-leads-all'] })
      // Força refetch imediato para garantir dados atualizados
      await queryClient.refetchQueries({ queryKey: ['kanban-board-leads-all'] })
      toast.success('Lead movido com sucesso!')
    },
    onError: (error, _variables, context) => {
      // Rollback em caso de erro - restaura o estado anterior
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      console.error('Erro ao mover lead:', error)
    },
  })

  const deleteBoardMutation = useMutation({
    mutationFn: async (boardId: number) => {
      return api.delete(`/kanban-boards/${boardId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-boards-admin'] })
      queryClient.invalidateQueries({ queryKey: ['kanban-board-leads-all'] })
    },
  })

  const handleDragStart = (e: React.DragEvent, lead: Lead, boardId: number) => {
    setDraggedLead(lead)
    setDraggedFromBoardId(boardId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, toBoardId: number) => {
    e.preventDefault()
    if (!draggedLead || !draggedFromBoardId) return

    const fromBoardId = draggedFromBoardId
    if (fromBoardId === toBoardId) return

    try {
      await moveLeadMutation.mutateAsync({
        leadId: draggedLead.id,
        fromBoardId,
        toBoardId,
      })
      setDraggedLead(null)
      setDraggedFromBoardId(null)
    } catch (error) {
      // Erro já é tratado pelo interceptor do axios
      console.error('Erro ao mover lead:', error)
    }
  }

  const handleCreateBoard = () => {
    if (!formData.nome || !formData.agente_id || !formData.kanban_modelo_id) {
      toast.warning('Preencha todos os campos obrigatórios')
      return
    }
    createBoardMutation.mutate(formData)
  }

  const handleDeleteBoard = async (boardId: number) => {
    if (!confirm('Tem certeza que deseja excluir este board?')) return
    try {
      await deleteBoardMutation.mutateAsync(boardId)
      toast.success('Board excluído com sucesso!')
    } catch (error: any) {
      // Erro já é tratado pelo interceptor do axios
      console.error('Erro ao excluir board:', error)
    }
  }


  if (boardsLoading) {
    return <div className="kanban-loading">Carregando boards...</div>
  }

  return (
    <div className="kanban-container">
      <div className="kanban-header">
        <h1>Kanban</h1>
        <div className="kanban-header-actions">
          {/* Botão Filtros */}
          <button
            onClick={() => setShowFiltersModal(true)}
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
            🔍 Filtros
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
          <input
            type="text"
            placeholder="Buscar por nome..."
            className="kanban-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            className="btn-exibir"
            onClick={() => {
              setCurrentPage(1)
              queryClient.invalidateQueries({ queryKey: ['kanban-board-leads-all'] })
            }}
          >
            Exibir
          </button>
        </div>
      </div>

      <div className="kanban-boards-container">
        {boards.map((board) => (
          <div
            key={board.id}
            className="kanban-board"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, board.id)}
          >
            <div
              className="kanban-board-header"
              style={{ backgroundColor: board.cor_hex }}
            >
              <span className="board-name">{board.nome}</span>
              <span className="board-count">
                {hasAnyFilter && boardLeads[board.id]?.total !== undefined
                  ? `${boardLeads[board.id].total} de ${board.leads_count || 0}`
                  : board.leads_count || 0}
              </span>
              {board.nome !== 'NOVOS' && board.leads_count === 0 && (
                <button
                  className="btn-delete-board"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteBoard(board.id)
                  }}
                  title="Excluir board"
                >
                  🗑️
                </button>
              )}
            </div>
            <div
              className="kanban-board-content"
              style={{ backgroundColor: `${board.cor_hex}99` }} // 60% opacity
            >
              {boardLeadsQueries.isLoading ? (
                <div>Carregando...</div>
              ) : (
                <>
                  {(boardLeads[board.id]?.data || []).map((lead) => (
                    <div
                      key={lead.id}
                      className="kanban-card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead, board.id)}
                    >
                      <div className="card-header">
                        <div className="card-name">
                          {lead.nome_fantasia_apelido || lead.nome_razao_social}
                        </div>
                        <div className="card-menu-container">
                          <button
                            className="card-menu-icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuLeadId(openMenuLeadId === lead.id ? null : lead.id)
                            }}
                            title="Menu"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="5" r="1"></circle>
                              <circle cx="12" cy="12" r="1"></circle>
                              <circle cx="12" cy="19" r="1"></circle>
                            </svg>
                          </button>
                          {openMenuLeadId === lead.id && (
                            <div className="card-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                              <button
                                className="card-menu-item"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingLead(lead)
                                  setOpenMenuLeadId(null)
                                }}
                              >
                                Editar Lead
                              </button>
                                <button
                                  className="card-menu-item"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedLeadForOccurrences(lead)
                                    setOpenMenuLeadId(null)
                                  }}
                                >
                                  Ocorrências
                                </button>
                                <button
                                  className="card-menu-item"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedLeadForSchedule(lead)
                                    setOpenMenuLeadId(null)
                                  }}
                                >
                                  Agendar contato
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      {lead.nome_fantasia_apelido && (
                        <div className="card-subtitle">{lead.nome_razao_social}</div>
                      )}
                      <div className="card-tags">
                        {lead.colaborador && (
                          <span className="card-tag card-tag-colaborador">
                            {lead.colaborador.nome}
                          </span>
                        )}
                        {lead.kanbanStatus && (
                          <span 
                            className="card-tag card-tag-status"
                            style={{ 
                              backgroundColor: lead.kanbanStatus.bg_color || '#e0e0e0',
                              color: lead.kanbanStatus.text_color || '#000'
                            }}
                          >
                            {lead.kanbanStatus.descricao}
                          </span>
                        )}
                      </div>
                      {lead.produtos && lead.produtos.length > 0 && (
                        <div className="card-product-tags">
                          {lead.produtos.map((produto) => (
                            <span key={produto.produto_id} className="card-product-tag">
                              {produto.descricao}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="card-footer">
                        <AppointmentBadge leadId={lead.id} />
                        {lead.data_entrada && (
                          <span 
                            className="card-data-entrada"
                            title="Data de entrada do lead"
                          >
                            {new Date(lead.data_entrada).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {(() => {
                    const boardData = boardLeads[board.id]
                    const total = boardData?.total || 0
                    const currentCount = boardData?.data?.length || 0
                    const hasMore = total > currentCount
                    // Mostra botão se houver mais resultados e se tiver pelo menos 50 resultados ou se estiver buscando
                    const showButton = hasMore && (currentCount >= 50 || filters.nome_razao_social || hasActiveFilters)
                    
                    return showButton ? (
                      <button 
                        className="btn-mostrar-mais"
                        onClick={async () => {
                          const nextPage = currentPage + 1
                          // Busca os próximos 50 para todos os boards
                          const leadsPromises = boards.map(board => {
                            const params = new URLSearchParams()
                            params.append('page', nextPage.toString())
                            params.append('limit', '50')
                            if (filters.nome_razao_social) {
                              params.append('nome_razao_social', filters.nome_razao_social)
                            }
                            if (filters.uf) {
                              params.append('uf', filters.uf)
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
                            if (filters.produtos && filters.produtos.length > 0) {
                              filters.produtos.forEach(produtoId => {
                                params.append('produtos', produtoId.toString())
                              })
                            }
                            return api.get(`/kanban-boards/${board.id}/leads?${params.toString()}`)
                              .then(res => ({ boardId: board.id, data: res.data }))
                              .catch(() => ({ boardId: board.id, data: { data: [], total: 0, page: nextPage, limit: 50 } }))
                          })
                          const results = await Promise.all(leadsPromises)
                          
                          // Atualiza o cache acumulando os novos dados com os dados atuais
                          const nextQueryKey = ['kanban-board-leads-all', boards.map(b => b.id).sort().join(','), filters, nextPage]
                          const currentData = boardLeads
                          const newData: Record<number, { data: Lead[]; total: number; page: number }> = {}
                          
                          results.forEach(({ boardId, data }) => {
                            const existingData = currentData[boardId]?.data || []
                            newData[boardId] = {
                              data: [...existingData, ...(data.data || [])],
                              total: data.total || 0,
                              page: nextPage
                            }
                          })
                          
                          // Atualiza o cache da próxima página
                          queryClient.setQueryData(nextQueryKey, newData)
                          setCurrentPage(nextPage)
                        }}
                      >
                        Ver mais
                      </button>
                    ) : null
                  })()}
                </>
              )}
            </div>
          </div>
        ))}

        <button
          className="btn-add-board"
          onClick={() => setShowCreateModal(true)}
          title="Adicionar novo board"
        >
          +
        </button>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Informe o nome do Board</h2>
            <div className="form-group">
              <label>Nome</label>
              <input
                type="text"
                maxLength={20}
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Selecione o Agente dono do board</label>
              <select
                value={formData.agente_id || ''}
                onChange={(e) => setFormData({ ...formData, agente_id: parseInt(e.target.value) })}
              >
                <option value="">Selecione</option>
                {agentes.map((agente) => (
                  <option key={agente.id} value={agente.id}>
                    {agente.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Selecione o modelo do Kanban</label>
              <select
                value={formData.kanban_modelo_id || ''}
                onChange={(e) => setFormData({ ...formData, kanban_modelo_id: parseInt(e.target.value) })}
              >
                <option value="">Selecione</option>
                {modelos.map((modelo) => (
                  <option key={modelo.kanban_modelo_id} value={modelo.kanban_modelo_id}>
                    {modelo.descricao}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Selecione a cor</label>
              <input
                type="color"
                value={formData.cor_hex}
                onChange={(e) => setFormData({ ...formData, cor_hex: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-fechar" onClick={() => setShowCreateModal(false)}>
                Fechar
              </button>
              <button className="btn-criar" onClick={handleCreateBoard}>
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ocorrências */}
      {selectedLeadForOccurrences && (
        <OccurrencesModal
          leadId={selectedLeadForOccurrences.id}
          leadName={selectedLeadForOccurrences.nome_fantasia_apelido || selectedLeadForOccurrences.nome_razao_social}
          onClose={() => setSelectedLeadForOccurrences(null)}
        />
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
              }}
              invalidateQueries={['kanban-board-leads-all']}
            />
          </div>
        </div>
      )}

      {/* Modal de Agendamento */}
      {selectedLeadForSchedule && (
        <ScheduleContactModal
          leadId={selectedLeadForSchedule.id}
          leadName={selectedLeadForSchedule.nome_fantasia_apelido || selectedLeadForSchedule.nome_razao_social}
          onClose={() => setSelectedLeadForSchedule(null)}
          invalidateQueries={['kanban-board-leads-all']}
        />
      )}

      {/* Modal de Filtros */}
      <FiltersModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        filters={filters}
        onFiltersChange={setFilters}
        onApply={() => {
          setCurrentPage(1)
          queryClient.invalidateQueries({ queryKey: ['kanban-board-leads-all'] })
        }}
        onClear={() => {
          setFilters({})
          setSearchTerm('')
          setCurrentPage(1)
          queryClient.invalidateQueries({ queryKey: ['kanban-board-leads-all'] })
        }}
        agentes={agentes}
        colaboradores={[]}
        isAdmin={true}
        isAgente={false}
      />
    </div>
  )
}

