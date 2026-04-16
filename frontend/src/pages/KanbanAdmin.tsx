import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { BoardWithLeadsCount, CreateKanbanBoardDto, KanbanBoardType, MoveLeadDto } from '../types/kanban-board'
import { Lead, FilterLeadsDto } from '../types/lead'
import { useAuth } from '../contexts/AuthContext'
import EditViewLeadModal from '../components/EditViewLeadModal'
import ScheduleContactModal from '../components/ScheduleContactModal'
import AppointmentBadge from '../components/AppointmentBadge'
import FiltersModal from '../components/FiltersModal'
import CreateLeadInBoardModal from '../components/CreateLeadInBoardModal'
import './KanbanAdmin.css'

const STORAGE_KEY_FILTERS = 'kanban-admin-filters'
const STORAGE_KEY_SEARCH_TYPE = 'kanban-admin-search-type'
const STORAGE_KEY_TIPO_FLUXO = 'kanban-admin-tipo-fluxo'
const STORAGE_KEY_EXPIRED_FILTER = 'kanban-admin-expired-filter'

type SearchType = 'nome' | 'email' | 'telefone'

// Função helper para verificar se um lead está expirado
const isLeadExpired = (lead: Lead, board: BoardWithLeadsCount): boolean => {
  if (!board.limit_days || board.limit_days === 0) return false;
  
  const referenceDate = lead.ultima_ocorrencia_date 
    ? new Date(lead.ultima_ocorrencia_date)
    : new Date(lead.data_entrada);
  
  const daysDiff = Math.floor(
    (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return daysDiff > board.limit_days;
};

export default function KanbanAdmin() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)
  const [draggedFromBoardId, setDraggedFromBoardId] = useState<number | null>(null)
  const [selectedLeadForEditView, setSelectedLeadForEditView] = useState<Lead | null>(null)
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
  // Removido currentPage global - cada board terá sua própria paginação
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [selectedBoardForNewLead, setSelectedBoardForNewLead] = useState<number | null>(null)
  // Carrega tipo de fluxo do localStorage (padrão: 'COMPRADOR')
  const [tipoFluxo, setTipoFluxo] = useState<'COMPRADOR' | 'VENDEDOR'>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TIPO_FLUXO)
    return (saved === 'COMPRADOR' || saved === 'VENDEDOR') ? saved : 'COMPRADOR'
  })
  
  // Carrega tipo de busca do localStorage (padrão: 'nome')
  const [searchType, setSearchType] = useState<SearchType>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SEARCH_TYPE)
    return (saved as SearchType) || 'nome'
  })

  // Estado para controlar abertura do dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
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
  
  // Estado para filtro de leads expirados (por board)
  const [expiredFilterActive, setExpiredFilterActive] = useState<Map<number, boolean>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_EXPIRED_FILTER);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return new Map(Object.entries(parsed).map(([k, v]) => [Number(k), v as boolean]));
      } catch {
        return new Map();
      }
    }
    return new Map();
  });

  // Salva filtros no localStorage quando mudarem
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(filters))
  }, [filters])

  // Salva tipo de busca no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SEARCH_TYPE, searchType)
  }, [searchType])

  // Salva tipo de fluxo no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TIPO_FLUXO, tipoFluxo)
  }, [tipoFluxo])

  // Salva estado do filtro de expirados no localStorage quando mudar
  useEffect(() => {
    const obj = Object.fromEntries(expiredFilterActive);
    localStorage.setItem(STORAGE_KEY_EXPIRED_FILTER, JSON.stringify(obj));
  }, [expiredFilterActive])

  // Função para alternar filtro de expirados
  const toggleExpiredFilter = (boardId: number) => {
    setExpiredFilterActive(prev => {
      const newMap = new Map(prev);
      newMap.set(boardId, !prev.get(boardId));
      return newMap;
    });
  };

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isDropdownOpen && !target.closest('[data-search-dropdown]')) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isDropdownOpen])
  
  // Funções auxiliares para busca dinâmica
  const getSearchValue = (): string => {
    switch (searchType) {
      case 'nome':
        return filters.nome_razao_social || ''
      case 'email':
        return filters.email || ''
      case 'telefone':
        return filters.telefone || ''
      default:
        return ''
    }
  }

  const setSearchValue = (value: string) => {
    const newFilters = { ...filters }
    // Limpa os outros campos de busca
    delete newFilters.nome_razao_social
    delete newFilters.email
    delete newFilters.telefone
    
    // Define o valor no campo correto
    if (value.trim()) {
      switch (searchType) {
        case 'nome':
          newFilters.nome_razao_social = value
          break
        case 'email':
          newFilters.email = value
          break
        case 'telefone':
          newFilters.telefone = value
          break
      }
    }
    setFilters(newFilters)
  }

  const getPlaceholder = (): string => {
    switch (searchType) {
      case 'nome':
        return 'Buscar por nome...'
      case 'email':
        return 'Buscar por e-mail...'
      case 'telefone':
        return 'Buscar por telefone...'
      default:
        return 'Buscar por nome...'
    }
  }

  const getSearchTypeLabel = (): string => {
    switch (searchType) {
      case 'nome':
        return 'Nome'
      case 'email':
        return 'E-mail'
      case 'telefone':
        return 'Telefone'
      default:
        return 'Nome'
    }
  }

  const handleSearchTypeChange = (newType: SearchType) => {
    const currentValue = getSearchValue()
    setIsDropdownOpen(false)
    
    // Cria novo objeto de filtros limpando os campos de busca anteriores
    const newFilters = { ...filters }
    delete newFilters.nome_razao_social
    delete newFilters.email
    delete newFilters.telefone
    
    // Mantém o valor digitado, apenas muda o campo que será usado
    if (currentValue.trim()) {
      switch (newType) {
        case 'nome':
          newFilters.nome_razao_social = currentValue
          break
        case 'email':
          newFilters.email = currentValue
          break
        case 'telefone':
          newFilters.telefone = currentValue
          break
      }
    }
    
    setSearchType(newType)
    setFilters(newFilters)
  }

  // Verificar se há filtros ativos (exceto campos de busca rápida)
  const hasActiveFilters = Boolean(
    filters.uf ||
    filters.vendedor_id ||
    filters.usuario_id_colaborador ||
    filters.origem_lead ||
    (filters.produtos && filters.produtos.length > 0)
  )
  
  // Verificar se há qualquer filtro ativo (incluindo busca rápida)
  const hasAnyFilter = Boolean(
    getSearchValue().trim() ||
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

  // Limpa modelo selecionado se não for compatível com o tipoFluxo atual
  useEffect(() => {
    if (formData.kanban_modelo_id && modelos.length > 0) {
      const modeloSelecionado = modelos.find(m => m.kanban_modelo_id === formData.kanban_modelo_id)
      if (modeloSelecionado && modeloSelecionado.tipo_fluxo !== tipoFluxo) {
        setFormData(prev => ({ ...prev, kanban_modelo_id: undefined }))
      }
    }
  }, [tipoFluxo, modelos, formData.kanban_modelo_id])

  // Busca boards
  const { data: boards = [], isLoading: boardsLoading, error: boardsError } = useQuery<BoardWithLeadsCount[]>({
    queryKey: ['kanban-boards-admin', tipoFluxo],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (tipoFluxo) {
        params.append('tipo_fluxo', tipoFluxo)
      }
      const response = await api.get(`/kanban-boards/admin?${params.toString()}`)
      console.log('[KanbanAdmin] Boards retornados:', response.data)
      console.log('[KanbanAdmin] Tipo Fluxo:', tipoFluxo)
      console.log('[KanbanAdmin] Quantidade de boards:', response.data?.length || 0)
      return response.data
    },
  })

  // Debug: Log de erros e boards
  useEffect(() => {
    if (boardsError) {
      console.error('[KanbanAdmin] Erro ao buscar boards:', boardsError)
    }
    console.log('[KanbanAdmin] Boards no estado:', boards)
    console.log('[KanbanAdmin] Boards length:', boards.length)
    console.log('[KanbanAdmin] Tipo Fluxo atual:', tipoFluxo)
  }, [boards, tipoFluxo, boardsError])

  // Busca leads de todos os boards automaticamente (sempre página 1 inicialmente)
  const boardLeadsQueries = useQuery({
    queryKey: ['kanban-board-leads-all', boards.map(b => b.id).sort().join(','), filters, tipoFluxo],
    queryFn: async () => {
      if (boards.length === 0) return {}
      const leadsPromises = boards.map(board => {
        const params = new URLSearchParams()
        params.append('page', '1')
        params.append('limit', '50')
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
          ufs.forEach(uf => {
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
        if (filters.produtos && filters.produtos.length > 0) {
          filters.produtos.forEach(produtoId => {
            params.append('produtos', produtoId.toString())
          })
        }
        const url = `/kanban-boards/${board.id}/leads?${params.toString()}`
        console.log(`[KanbanAdmin] Buscando leads para board ${board.id} (${board.nome}):`)
        console.log(`[KanbanAdmin]   URL: ${url}`)
        console.log(`[KanbanAdmin]   Parâmetros:`, Object.fromEntries(params.entries()))
        
        return api.get(url)
          .then(res => {
            console.log(`[KanbanAdmin] Resposta para board ${board.id} (${board.nome}):`, res.data)
            console.log(`[KanbanAdmin] Total de leads recebidos para board ${board.id}:`, res.data?.data?.length || 0)
            console.log(`[KanbanAdmin] Total no banco para board ${board.id}:`, res.data?.total || 0)
            return { boardId: board.id, data: res.data }
          })
          .catch((error) => {
            console.error(`[KanbanAdmin] Erro ao buscar leads do board ${board.id}:`, error)
            return { boardId: board.id, data: { data: [], total: 0, page: 1, limit: 50 } }
          })
      })
      const results = await Promise.all(leadsPromises)
      const leadsMap: Record<number, { data: Lead[]; total: number; page: number }> = {}
      
      results.forEach(({ boardId, data }) => {
        const leadsArray = data.data || []
        
        // Exibe SQL no console do navegador
        if (data.sql) {
          console.log(`[KanbanAdmin] ========== SQL QUERY PARA BOARD ${boardId} ==========`)
          console.log(`[KanbanAdmin] SQL (com parâmetros substituídos):`)
          console.log(data.sql)
          if (data.sqlRaw) {
            console.log(`[KanbanAdmin] SQL (com placeholders):`)
            console.log(data.sqlRaw)
          }
          if (data.params) {
            console.log(`[KanbanAdmin] Parâmetros:`)
            console.log(data.params)
          }
          console.log(`[KanbanAdmin] ========== FIM SQL QUERY BOARD ${boardId} ==========`)
        }
        
        console.log(`[KanbanAdmin] Processando board ${boardId}:`, {
          total: data.total || 0,
          leadsArrayLength: leadsArray.length,
          page: data.page || 1,
          dataKeys: Object.keys(data)
        })
        
        // Sempre página 1 na query inicial
        leadsMap[boardId] = { 
          data: leadsArray, 
          total: data.total || 0,
          page: data.page || 1
        }
      })
      console.log('[KanbanAdmin] LeadsMap final:', Object.keys(leadsMap).map(id => ({
        boardId: id,
        leadsCount: leadsMap[parseInt(id)].data.length,
        total: leadsMap[parseInt(id)].total
      })))
      return leadsMap
    },
    enabled: boards.length > 0,
  })

  const boardLeads = boardLeadsQueries.data || {}

  // Desativa filtro de expirados automaticamente se não houver leads expirados
  useEffect(() => {
    if (!boards.length || !boardLeadsQueries.data) return;
    
    const newExpiredFilter = new Map(expiredFilterActive);
    let hasChanges = false;
    
    boards.forEach(board => {
      if (expiredFilterActive.get(board.id)) {
        const leads = boardLeads[board.id]?.data || [];
        const hasExpiredLeads = (board.limit_days ?? 0) > 0 && leads.some(lead => isLeadExpired(lead, board));
        
        if (!hasExpiredLeads) {
          newExpiredFilter.delete(board.id);
          hasChanges = true;
        }
      }
    });
    
    if (hasChanges) {
      setExpiredFilterActive(newExpiredFilter);
    }
  }, [boardLeads, boards, expiredFilterActive])

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
    createBoardMutation.mutate({
      ...formData,
      tipo_fluxo: tipoFluxo,
    })
  }


  if (boardsLoading) {
    return <div className="kanban-loading">Carregando boards...</div>
  }

  return (
    <div className="kanban-container">
      <div className="kanban-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1>Kanban</h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => {
                setTipoFluxo('COMPRADOR')
                queryClient.invalidateQueries({ queryKey: ['kanban-boards-admin'] })
                queryClient.invalidateQueries({ queryKey: ['kanban-board-leads-all'] })
              }}
              style={{
                backgroundColor: tipoFluxo === 'COMPRADOR' ? '#3498db' : 'white',
                color: tipoFluxo === 'COMPRADOR' ? 'white' : '#333',
                border: tipoFluxo === 'COMPRADOR' ? 'none' : '1px solid #ddd',
                borderRadius: '20px',
                padding: '8px 20px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: tipoFluxo === 'COMPRADOR' ? 'bold' : 'normal',
                transition: 'all 0.3s ease',
              }}
            >
              Comprador
            </button>
            <button
              onClick={() => {
                setTipoFluxo('VENDEDOR')
                queryClient.invalidateQueries({ queryKey: ['kanban-boards-admin'] })
                queryClient.invalidateQueries({ queryKey: ['kanban-board-leads-all'] })
              }}
              style={{
                backgroundColor: tipoFluxo === 'VENDEDOR' ? '#3498db' : 'white',
                color: tipoFluxo === 'VENDEDOR' ? 'white' : '#333',
                border: tipoFluxo === 'VENDEDOR' ? 'none' : '1px solid #ddd',
                borderRadius: '20px',
                padding: '8px 20px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: tipoFluxo === 'VENDEDOR' ? 'bold' : 'normal',
                transition: 'all 0.3s ease',
              }}
            >
              Vendedor
            </button>
          </div>
        </div>
        <div className="kanban-header-actions">
          {/* Botão Filtros */}
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
          {/* Dropdown e Campo de busca rápida */}
          <div data-search-dropdown style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            {/* Botão dropdown para selecionar tipo de busca */}
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                backgroundColor: 'rgb(149, 165, 166)',
                color: 'white',
                border: 'none',
                borderRadius: '4px 0 0 4px',
                cursor: 'pointer',
                padding: '8px 12px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap',
                borderRight: '1px solid rgb(149, 165, 166)'
              }}
            >
              <span>{getSearchTypeLabel()}</span>
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{
                  transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            
            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  zIndex: 1000,
                  minWidth: '120px'
                }}
              >
                <button
                  type="button"
                  onClick={() => handleSearchTypeChange('nome')}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    textAlign: 'left',
                    border: 'none',
                    backgroundColor: searchType === 'nome' ? '#e3f2fd' : 'white',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  onMouseEnter={(e) => {
                    if (searchType !== 'nome') {
                      e.currentTarget.style.backgroundColor = '#f5f5f5'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (searchType !== 'nome') {
                      e.currentTarget.style.backgroundColor = 'white'
                    }
                  }}
                >
                  Nome
                </button>
                <button
                  type="button"
                  onClick={() => handleSearchTypeChange('email')}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    textAlign: 'left',
                    border: 'none',
                    borderTop: '1px solid #eee',
                    backgroundColor: searchType === 'email' ? '#e3f2fd' : 'white',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  onMouseEnter={(e) => {
                    if (searchType !== 'email') {
                      e.currentTarget.style.backgroundColor = '#f5f5f5'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (searchType !== 'email') {
                      e.currentTarget.style.backgroundColor = 'white'
                    }
                  }}
                >
                  E-mail
                </button>
                <button
                  type="button"
                  onClick={() => handleSearchTypeChange('telefone')}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    textAlign: 'left',
                    border: 'none',
                    borderTop: '1px solid #eee',
                    backgroundColor: searchType === 'telefone' ? '#e3f2fd' : 'white',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  onMouseEnter={(e) => {
                    if (searchType !== 'telefone') {
                      e.currentTarget.style.backgroundColor = '#f5f5f5'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (searchType !== 'telefone') {
                      e.currentTarget.style.backgroundColor = 'white'
                    }
                  }}
                >
                  Telefone
                </button>
              </div>
            )}

            {/* Campo de busca */}
            <input
              type="text"
              placeholder={getPlaceholder()}
              className="kanban-search"
              value={getSearchValue()}
              onChange={(e) => setSearchValue(e.target.value)}
              style={{
                borderTop: '1px solid rgb(149, 165, 166)',
                borderRight: '1px solid rgb(149, 165, 166)',
                borderBottom: '1px solid rgb(149, 165, 166)',
                borderLeft: 'none',
                borderRadius: '0 4px 4px 0',
                height: '31px'
              }}
            />
          </div>
          <button 
            className="btn-exibir"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['kanban-board-leads-all'] })
            }}
          >
            Exibir
          </button>
        </div>
      </div>

      <div className="kanban-boards-container">
        {boards.length === 0 && !boardsLoading && (
          <div style={{ 
            padding: '40px 20px', 
            textAlign: 'center', 
            color: '#666',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            margin: '20px 0'
          }}>
            <p style={{ fontSize: '16px', marginBottom: '10px' }}>
              Nenhum board encontrado para o tipo de fluxo <strong>"{tipoFluxo}"</strong>.
            </p>
            {tipoFluxo === 'COMPRADOR' && (
              <p style={{ fontSize: '14px', color: '#999' }}>
                Verifique se há boards cadastrados ou se os boards existentes têm tipo_fluxo definido.
              </p>
            )}
            {tipoFluxo === 'VENDEDOR' && (
              <p style={{ fontSize: '14px', color: '#999' }}>
                Crie boards do tipo VENDEDOR ou configure modelos com tipo_fluxo = VENDEDOR.
              </p>
            )}
          </div>
        )}
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
              <div className="board-header-actions">
                <button
                  className="btn-add-lead"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedBoardForNewLead(board.id)
                  }}
                  title="Novo Lead"
                >
                  +
                </button>
                {user?.perfil === 'ADMIN' && (
                  <button
                    className="btn-export-leads"
                    onClick={async (e) => {
                    e.stopPropagation()
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
                        ufs.forEach(uf => {
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
                      if (filters.produtos && filters.produtos.length > 0) {
                        filters.produtos.forEach(produtoId => {
                          params.append('produtos', produtoId.toString())
                        })
                      }
                      const response = await api.get(`/kanban-boards/${board.id}/leads/export?${params.toString()}`, {
                        responseType: 'blob'
                      })
                      const url = window.URL.createObjectURL(new Blob([response.data]))
                      const link = document.createElement('a')
                      link.href = url
                      link.setAttribute('download', `leads-${board.nome.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`)
                      document.body.appendChild(link)
                      link.click()
                      link.remove()
                      window.URL.revokeObjectURL(url)
                      toast.success('Leads exportados com sucesso!')
                    } catch (error: any) {
                      console.error('Erro ao exportar leads:', error)
                      toast.error(error.response?.data?.message || 'Erro ao exportar leads')
                    }
                  }}
                  title="Exportar leads"
                  disabled={!boardLeads[board.id]?.total || boardLeads[board.id].total === 0}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="3" x2="9" y2="21"></line>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                  </svg>
                  </button>
                )}
                {(() => {
                  const leads = boardLeads[board.id]?.data || [];
                  const hasExpiredLeads = (board.limit_days ?? 0) > 0 && leads.some(lead => isLeadExpired(lead, board));
                  return hasExpiredLeads && (
                    <button
                      className="btn-expired-filter"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpiredFilter(board.id);
                      }}
                      title={expiredFilterActive.get(board.id) 
                        ? "Exibir todos os leads" 
                        : "Exibir somente expirados"}
                      style={{
                        backgroundColor: expiredFilterActive.get(board.id) ? 'white' : 'transparent'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff9800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                    </button>
                  );
                })()}
                <span className="board-count">
                  {hasAnyFilter && boardLeads[board.id]?.total !== undefined
                    ? `${boardLeads[board.id].total} de ${board.leads_count || 0}`
                    : board.leads_count || 0}
                </span>
              </div>
            </div>
            <div
              className="kanban-board-content"
              style={{ backgroundColor: `${board.cor_hex}99` }} // 60% opacity
            >
              {boardLeadsQueries.isLoading ? (
                <div>Carregando...</div>
              ) : (
                <>
                  {(() => {
                    const leads = boardLeads[board.id]?.data || []
                    const total = boardLeads[board.id]?.total || 0
                    console.log(`[KanbanAdmin] Renderizando board ${board.id} (${board.nome}):`, {
                      leadsCount: leads.length,
                      total,
                      hasData: !!boardLeads[board.id],
                      boardLeadsKeys: Object.keys(boardLeads),
                      firstLead: leads[0] ? { id: leads[0].id, nome: leads[0].nome_razao_social } : null
                    })
                    if (total > 0 && leads.length === 0) {
                      console.error(`[KanbanAdmin] ⚠️ ERRO: Board ${board.id} tem total=${total} mas array está vazio!`)
                      console.error(`[KanbanAdmin] boardLeads[${board.id}]:`, boardLeads[board.id])
                    }
                    // Aplicar filtro de expirados se ativo
                    const filteredLeads = expiredFilterActive.get(board.id)
                      ? leads.filter(lead => isLeadExpired(lead, board))
                      : leads;
                    return filteredLeads.map((lead) => {
                      const isExpired = isLeadExpired(lead, board);
                      return (
                    <div
                      key={lead.id}
                      className="kanban-card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead, board.id)}
                      onClick={(e) => {
                        // Não abre o modal se clicar em elementos interativos (botões, links, etc)
                        const target = e.target as HTMLElement
                        if (target.closest('button') || target.closest('a') || target.closest('.card-menu-container')) {
                          return
                        }
                        setSelectedLeadForEditView(lead)
                      }}
                      style={{ cursor: 'pointer' }}
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
                                  setSelectedLeadForEditView(lead)
                                  setOpenMenuLeadId(null)
                                }}
                              >
                                Editar/Ver lead
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
                          {lead.produtos.map((produto) => {
                            // Função helper para limpar e validar valores de cor
                            const cleanColorValue = (colorValue: string | null | undefined, fallback: string): string => {
                              if (!colorValue) return fallback;
                              // Remove espaços, pontos e vírgulas no final, e valida formato hex
                              const cleaned = colorValue.trim().replace(/[;\s]+$/, '');
                              // Valida se é um valor hex válido ou nome de cor CSS válido
                              if (cleaned === '' || cleaned.length === 0) return fallback;
                              return cleaned;
                            };
                            
                            const bgColor = cleanColorValue(produto.produto_tipo?.bg_color, '#e3f2fd');
                            const textColor = cleanColorValue(produto.produto_tipo?.color, '#1976d2');
                            
                            // Debug: log se produto_tipo não estiver disponível ou se cores estiverem vazias
                            if (!produto.produto_tipo) {
                              console.warn(`[KanbanAdmin] Produto ${produto.produto_id} (${produto.descricao}) não tem produto_tipo`);
                            } else if (!produto.produto_tipo.bg_color || produto.produto_tipo.bg_color.trim() === '') {
                              console.warn(`[KanbanAdmin] Produto ${produto.produto_id} (${produto.descricao}) tem produto_tipo mas bg_color está vazio/null`);
                            }
                            
                            return (
                              <span 
                                key={produto.produto_id} 
                                className="card-product-tag"
                                style={{ 
                                  backgroundColor: bgColor,
                                  color: textColor
                                }}
                              >
                                {produto.descricao}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      <div className="card-footer">
                        <AppointmentBadge leadId={lead.id} />
                        {(lead.ultima_ocorrencia_date || lead.data_entrada) && (
                          <span 
                            className={`card-data-entrada ${isExpired ? 'card-data-expired' : ''}`}
                            title={lead.ultima_ocorrencia_date 
                              ? "Data da última ocorrência" 
                              : "Data de entrada do lead"}
                          >
                            {isExpired && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff9800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', flexShrink: 0 }}>
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                              </svg>
                            )}
                            {lead.ultima_ocorrencia_date
                              ? new Date(lead.ultima_ocorrencia_date).toLocaleDateString('pt-BR')
                              : new Date(lead.data_entrada).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                      );
                    })
                  })()}
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
                          // Pega a página atual deste board específico
                          const currentBoardPage = boardData?.page || 1
                          const nextPage = currentBoardPage + 1
                          
                          // Busca apenas os próximos 50 leads deste board específico
                          const params = new URLSearchParams()
                          params.append('page', nextPage.toString())
                          params.append('limit', '50')
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
                            ufs.forEach(uf => {
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
                          if (filters.produtos && filters.produtos.length > 0) {
                            filters.produtos.forEach(produtoId => {
                              params.append('produtos', produtoId.toString())
                            })
                          }
                          
                          try {
                            const response = await api.get(`/kanban-boards/${board.id}/leads?${params.toString()}`)
                            const newLeadsData = response.data
                            
                            // Atualiza o cache preservando os dados de todos os outros boards
                            const queryKey = ['kanban-board-leads-all', boards.map(b => b.id).sort().join(','), filters, tipoFluxo]
                            const currentData = queryClient.getQueryData<Record<number, { data: Lead[]; total: number; page: number }>>(queryKey) || boardLeads
                            
                            // Cria novo objeto preservando todos os boards e atualizando apenas o board clicado
                            const updatedData: Record<number, { data: Lead[]; total: number; page: number }> = {
                              ...currentData
                            }
                            
                            // Atualiza apenas o board específico, acumulando os novos leads
                            const existingLeads = updatedData[board.id]?.data || []
                            updatedData[board.id] = {
                              data: [...existingLeads, ...(newLeadsData.data || [])],
                              total: newLeadsData.total || 0,
                              page: nextPage
                            }
                            
                            // Atualiza o cache preservando todos os boards
                            queryClient.setQueryData(queryKey, updatedData)
                          } catch (error) {
                            console.error(`Erro ao carregar mais leads do board ${board.id}:`, error)
                            toast.error('Erro ao carregar mais leads')
                          }
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
                {modelos
                  .filter((modelo) => modelo.tipo_fluxo === tipoFluxo)
                  .map((modelo) => (
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

      {/* Modal de Editar/Ver Lead */}
      {selectedLeadForEditView && (
        <EditViewLeadModal
          lead={selectedLeadForEditView}
          leadName={selectedLeadForEditView.nome_fantasia_apelido || selectedLeadForEditView.nome_razao_social}
          onClose={() => setSelectedLeadForEditView(null)}
          onSuccess={() => {
            setSelectedLeadForEditView(null)
          }}
          invalidateQueries={['kanban-board-leads-all']}
        />
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
          queryClient.invalidateQueries({ queryKey: ['kanban-board-leads-all'] })
        }}
        onClear={() => {
          setFilters({})
          setSearchValue('')
          queryClient.invalidateQueries({ queryKey: ['kanban-board-leads-all'] })
        }}
        agentes={agentes}
        colaboradores={[]}
        isAdmin={true}
        isAgente={false}
      />

      {/* Modal de Criação de Lead */}
      {selectedBoardForNewLead && (() => {
        const selectedBoard = boards.find(b => b.id === selectedBoardForNewLead)
        return (
          <div className="modal-overlay" onClick={() => setSelectedBoardForNewLead(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
              <CreateLeadInBoardModal
                boardId={selectedBoardForNewLead}
                onClose={() => setSelectedBoardForNewLead(null)}
                onSuccess={() => {
                  setSelectedBoardForNewLead(null)
                  queryClient.invalidateQueries({ queryKey: ['kanban-board-leads-all'] })
                }}
                invalidateQueries={['kanban-board-leads-all']}
                tipoFluxo={selectedBoard?.tipo_fluxo || undefined}
              />
            </div>
          </div>
        )
      })()}
    </div>
  )
}
