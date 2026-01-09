import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { BoardWithLeadsCount, MoveLeadDto } from '../types/kanban-board'
import { Lead } from '../types/lead'
import { useAuth } from '../contexts/AuthContext'
import OccurrencesModal from '../components/OccurrencesModal'
import EditLeadModal from '../components/EditLeadModal'
import ScheduleContactModal from '../components/ScheduleContactModal'
import AppointmentBadge from '../components/AppointmentBadge'
import { FilterLeadsDto } from '../types/lead'
import './KanbanColaborador.css'

const STORAGE_KEY_FILTERS = 'kanban-colaborador-filters'

// Tipo estendido para incluir campos específicos da tela
interface ExtendedFilters extends FilterLeadsDto {
  selectedAgenteId?: string
  selectedColaboradorId?: string
}

export default function KanbanColaborador() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)
  const [draggedFromBoardId, setDraggedFromBoardId] = useState<number | null>(null)
  const [selectedLeadForOccurrences, setSelectedLeadForOccurrences] = useState<Lead | null>(null)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [selectedLeadForSchedule, setSelectedLeadForSchedule] = useState<Lead | null>(null)
  const [openMenuLeadId, setOpenMenuLeadId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Carrega filtros do localStorage na inicialização
  const [filters, setFilters] = useState<ExtendedFilters>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_FILTERS)
    if (saved) {
      try {
        return JSON.parse(saved) as ExtendedFilters
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

  // Constantes derivadas dos filters
  const selectedAgenteId = filters.selectedAgenteId || ''
  const selectedColaboradorId = filters.selectedColaboradorId || ''
  const searchTerm = filters.nome_razao_social || ''

  // Funções setters que atualizam filters e invalidam queries
  const setSelectedAgenteId = (value: string) => {
    setFilters(prev => ({
      ...prev,
      selectedAgenteId: value || undefined,
      // Sempre limpa o colaborador quando muda o agente
      selectedColaboradorId: undefined
    }))
    setCurrentPage(1)
    // Remove dados do cache para evitar exibir boards antigos
    queryClient.removeQueries({ queryKey: ['kanban-boards-colaborador'] })
    queryClient.removeQueries({ queryKey: getLeadsQueryKey() })
  }

  const setSelectedColaboradorId = (value: string) => {
    setFilters(prev => ({ ...prev, selectedColaboradorId: value || undefined }))
    setCurrentPage(1)
    queryClient.invalidateQueries({ queryKey: ['kanban-boards-colaborador'] })
    queryClient.invalidateQueries({ queryKey: getLeadsQueryKey() })
  }

  const setSearchTerm = (value: string) => {
    setFilters(prev => ({ ...prev, nome_razao_social: value || undefined }))
    setCurrentPage(1)
    queryClient.invalidateQueries({ queryKey: getLeadsQueryKey() })
  }

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
  const [agentes, setAgentes] = useState<any[]>([])
  const [colaboradores, setColaboradores] = useState<any[]>([])

  // Busca agentes (se Admin ou Agente)
  useEffect(() => {
    if (user?.perfil === 'ADMIN') {
      api.get('/users/agentes').then((res) => setAgentes(res.data))
    } else if (user?.perfil === 'AGENTE') {
      // Agente vê apenas seus colaboradores
      api.get('/users/colaboradores').then((res) => setColaboradores(res.data))
    }
  }, [user])

  // Busca colaboradores do agente selecionado (se Admin)
  useEffect(() => {
    if (user?.perfil === 'ADMIN' && selectedAgenteId) {
      api.get(`/users/colaboradores?agente_id=${selectedAgenteId}`).then((res) => {
        setColaboradores(res.data)
      })
    }
  }, [selectedAgenteId, user])

  // Determina colaboradorId baseado no perfil
  const colaboradorId = user?.perfil === 'COLABORADOR' 
    ? (typeof user.id === 'string' ? parseInt(user.id, 10) : user.id)
    : user?.perfil === 'ADMIN' 
      ? (selectedColaboradorId ? parseInt(selectedColaboradorId, 10) : undefined)
      : (selectedColaboradorId ? parseInt(selectedColaboradorId, 10) : undefined)

  // Verifica se as condições para exibir boards estão satisfeitas
  const shouldLoadBoards = user?.perfil === 'COLABORADOR' || 
    (user?.perfil === 'ADMIN' && !!selectedAgenteId && !!selectedColaboradorId) || 
    (user?.perfil === 'AGENTE' && !!selectedColaboradorId)

  // Helper para gerar queryKey base de leads (inclui contexto de colaborador/agente)
  const getLeadsQueryKey = (boardsIds?: string, search?: string, page?: number) => {
    const baseKey = ['kanban-board-leads-all-colaborador', colaboradorId, selectedAgenteId]
    if (boardsIds !== undefined) baseKey.push(boardsIds)
    if (search !== undefined) baseKey.push(search)
    if (page !== undefined) baseKey.push(page)
    return baseKey
  }

  // Limpa dados do cache quando as condições não são mais válidas
  useEffect(() => {
    if (!shouldLoadBoards) {
      queryClient.removeQueries({ queryKey: ['kanban-boards-colaborador'] })
      queryClient.removeQueries({ queryKey: getLeadsQueryKey() })
    }
  }, [shouldLoadBoards, queryClient, colaboradorId, selectedAgenteId])

  // Busca boards
  const { data: boards = [], isLoading: boardsLoading, error: boardsError } = useQuery<BoardWithLeadsCount[]>({
    queryKey: ['kanban-boards-colaborador', colaboradorId, selectedAgenteId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (user?.perfil === 'ADMIN' && selectedAgenteId) {
        params.append('agente_id', selectedAgenteId)
      }
      if (colaboradorId) {
        params.append('colaborador_id', colaboradorId.toString())
      }
      const queryString = params.toString()
      const response = await api.get(`/kanban-boards/colaborador${queryString ? `?${queryString}` : ''}`)
      return response.data || []
    },
    enabled: shouldLoadBoards,
    retry: 1,
  })

  // Busca leads de todos os boards automaticamente
  const boardLeadsQueries = useQuery({
    queryKey: getLeadsQueryKey(boards.map(b => b.id).sort().join(','), searchTerm, currentPage),
    queryFn: async () => {
      if (boards.length === 0) return {}
      const leadsPromises = boards.map(board => {
        const params = new URLSearchParams()
        params.append('page', currentPage.toString())
        params.append('limit', '50')
        if (searchTerm.trim()) {
          params.append('nome', searchTerm.trim())
        }
        return api.get(`/kanban-boards/${board.id}/leads?${params.toString()}`)
          .then(res => ({ boardId: board.id, data: res.data }))
          .catch(() => ({ boardId: board.id, data: { data: [], total: 0, page: currentPage, limit: 50 } }))
      })
      const results = await Promise.all(leadsPromises)
      const leadsMap: Record<number, { data: Lead[]; total: number; page: number }> = {}
      
      // Pega dados anteriores do cache
      const previousData = queryClient.getQueryData<Record<number, { data: Lead[]; total: number; page: number }>>(
        getLeadsQueryKey(boards.map(b => b.id).sort().join(','), searchTerm, currentPage - 1)
      ) || {}
      
      results.forEach(({ boardId, data }) => {
        if (currentPage === 1) {
          leadsMap[boardId] = { 
            data: data.data || [], 
            total: data.total || 0,
            page: data.page || currentPage
          }
        } else {
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

  const moveLeadMutation = useMutation({
    mutationFn: async ({ leadId, fromBoardId, toBoardId }: { leadId: number; fromBoardId: number; toBoardId: number }) => {
      const moveDto: MoveLeadDto = { from_board_id: fromBoardId, to_board_id: toBoardId }
      return api.post(`/kanban-boards/leads/${leadId}/move`, moveDto)
    },
    onMutate: async (variables) => {
      // Cancela queries em andamento para evitar sobrescrever a atualização otimista
      await queryClient.cancelQueries({ queryKey: getLeadsQueryKey() })
      
      // Snapshot do estado anterior para rollback em caso de erro
      const previousData = queryClient.getQueriesData({ queryKey: getLeadsQueryKey() })
      
      // Atualização otimista - atualiza todas as queries relacionadas
      queryClient.setQueriesData<Record<number, { data: Lead[]; total: number; page: number }>>(
        { queryKey: getLeadsQueryKey() },
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
      await queryClient.invalidateQueries({ queryKey: ['kanban-boards-colaborador'] })
      await queryClient.invalidateQueries({ queryKey: getLeadsQueryKey() })
      // Força refetch imediato para garantir dados atualizados
      await queryClient.refetchQueries({ queryKey: getLeadsQueryKey() })
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
      queryClient.invalidateQueries({ queryKey: ['kanban-boards-colaborador'] })
      queryClient.invalidateQueries({ queryKey: getLeadsQueryKey() })
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

  const handleExibir = () => {
    if (user?.perfil === 'ADMIN' && (!selectedAgenteId || !selectedColaboradorId)) {
      toast.warning('Selecione um Agente e um Colaborador para exibir')
      return
    }
    if (user?.perfil === 'AGENTE' && !selectedColaboradorId) {
      toast.warning('Selecione um Colaborador para exibir')
      return
    }
    setCurrentPage(1)
    queryClient.invalidateQueries({ queryKey: getLeadsQueryKey() })
  }

  if (boardsLoading) {
    return <div className="kanban-loading">Carregando boards...</div>
  }

  if (boardsError) {
    console.error('Erro ao carregar boards:', boardsError)
    return <div className="kanban-loading">Erro ao carregar boards. Tente novamente.</div>
  }

  return (
    <div className="kanban-container">
      <div className="kanban-header">
        <h1>Funil de vendas - Kanban</h1>
        <div className="kanban-header-actions">
          {user?.perfil === 'ADMIN' && (
            <>
              <select
                value={selectedAgenteId}
                onChange={(e) => setSelectedAgenteId(e.target.value)}
                className="kanban-filter-select"
              >
                <option value="">Selecione o Agente</option>
                {agentes.map((agente) => (
                  <option key={agente.id} value={agente.id}>
                    {agente.nome}
                  </option>
                ))}
              </select>
              <select
                value={selectedColaboradorId}
                onChange={(e) => setSelectedColaboradorId(e.target.value)}
                className="kanban-filter-select"
                disabled={!selectedAgenteId}
              >
                <option value="">Selecione o Colaborador</option>
                {colaboradores.map((colaborador) => (
                  <option key={colaborador.id} value={colaborador.id}>
                    {colaborador.nome}
                  </option>
                ))}
              </select>
            </>
          )}
          {user?.perfil === 'AGENTE' && (
            <select
              value={selectedColaboradorId}
              onChange={(e) => setSelectedColaboradorId(e.target.value)}
              className="kanban-filter-select"
            >
              <option value="">Selecione o Colaborador</option>
              {colaboradores.map((colaborador) => (
                <option key={colaborador.id} value={colaborador.id}>
                  {colaborador.nome}
                </option>
              ))}
            </select>
          )}
          <input
            type="text"
            placeholder="Buscar por nome..."
            className="kanban-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn-exibir" onClick={handleExibir}>Exibir</button>
        </div>
      </div>

      {(user?.perfil === 'COLABORADOR' || 
        (user?.perfil === 'ADMIN' && selectedAgenteId && selectedColaboradorId) ||
        (user?.perfil === 'AGENTE' && selectedColaboradorId)) && (
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
                style={{ backgroundColor: board.cor_hex, color: 'black' }}
              >
                <span className="board-name">{board.nome}</span>
                <span className="board-count">{board.leads_count || 0}</span>
                {board.nome !== 'NOVOS' && board.leads_count === 0 && (user?.perfil === 'ADMIN' || user?.perfil === 'AGENTE') && (
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
                style={{ backgroundColor: `${board.cor_hex}99` }}
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
                      const showButton = hasMore && (currentCount >= 50 || searchTerm.trim())
                      
                      return showButton ? (
                        <button 
                          className="btn-mostrar-mais"
                          onClick={async () => {
                            const nextPage = currentPage + 1
                            const leadsPromises = boards.map(board => {
                              const params = new URLSearchParams()
                              params.append('page', nextPage.toString())
                              params.append('limit', '50')
                              if (searchTerm.trim()) {
                                params.append('nome', searchTerm.trim())
                              }
                              return api.get(`/kanban-boards/${board.id}/leads?${params.toString()}`)
                                .then(res => ({ boardId: board.id, data: res.data }))
                                .catch(() => ({ boardId: board.id, data: { data: [], total: 0, page: nextPage, limit: 50 } }))
                            })
                            const results = await Promise.all(leadsPromises)
                            
                            const nextQueryKey = getLeadsQueryKey(boards.map(b => b.id).sort().join(','), searchTerm, nextPage)
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
              invalidateQueries={['kanban-board-leads-all-colaborador']}
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
          invalidateQueries={['kanban-board-leads-all-colaborador']}
        />
      )}
    </div>
  )
}

