import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { BoardWithLeadsCount, CreateKanbanBoardDto, KanbanBoardType, MoveLeadDto } from '../types/kanban-board'
import { Lead, FilterLeadsDto } from '../types/lead'
import { useAuth } from '../contexts/AuthContext'
import OccurrencesModal from '../components/OccurrencesModal'
import EditLeadModal from '../components/EditLeadModal'
import ScheduleContactModal from '../components/ScheduleContactModal'
import AppointmentBadge from '../components/AppointmentBadge'
import FiltersModal from '../components/FiltersModal'
import CreateLeadInBoardModal from '../components/CreateLeadInBoardModal'
import './KanbanAgente.css'

const STORAGE_KEY_FILTERS = 'kanban-agente-filters'
const STORAGE_KEY_SEARCH_TYPE = 'kanban-agente-search-type'
const STORAGE_KEY_TIPO_FLUXO = 'kanban-agente-tipo-fluxo'

type SearchType = 'nome' | 'email' | 'telefone'

// Tipo estendido para incluir campos específicos da tela
interface ExtendedFilters extends FilterLeadsDto {
  selectedAgenteId?: string
}

export default function KanbanAgente() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)
  const [draggedFromBoardId, setDraggedFromBoardId] = useState<number | null>(null)
  const [selectedLeadForOccurrences, setSelectedLeadForOccurrences] = useState<Lead | null>(null)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [selectedLeadForSchedule, setSelectedLeadForSchedule] = useState<Lead | null>(null)
  const [openMenuLeadId, setOpenMenuLeadId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [availableTypes, setAvailableTypes] = useState<('COMPRADOR' | 'VENDEDOR')[]>([])
  const [selectedBoardForNewLead, setSelectedBoardForNewLead] = useState<number | null>(null)
  
  // Carrega tipo de busca do localStorage (padrão: 'nome')
  const [searchType, setSearchType] = useState<SearchType>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SEARCH_TYPE)
    return (saved as SearchType) || 'nome'
  })

  // Carrega tipo de fluxo do localStorage
  const [tipoFluxo, setTipoFluxo] = useState<'COMPRADOR' | 'VENDEDOR' | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TIPO_FLUXO)
    return (saved === 'COMPRADOR' || saved === 'VENDEDOR') ? saved : null
  })

  // Estado para controlar abertura do dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
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

  // Sincroniza selectedAgenteId com filters
  const selectedAgenteId = filters.selectedAgenteId || ''
  
  // Helper para gerar queryKey base de leads (inclui contexto de agente e tipo_fluxo)
  const getLeadsQueryKey = (boardsIds?: string, filtersData?: FilterLeadsDto, page?: number) => {
    const baseKey: any[] = ['kanban-board-leads-all-agente', selectedAgenteId, tipoFluxo]
    if (boardsIds !== undefined) baseKey.push(boardsIds)
    if (filtersData !== undefined) baseKey.push(filtersData)
    if (page !== undefined) baseKey.push(page)
    return baseKey
  }
  
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
    if (tipoFluxo) {
      localStorage.setItem(STORAGE_KEY_TIPO_FLUXO, tipoFluxo)
    }
  }, [tipoFluxo])

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

  // Função para atualizar selectedAgenteId
  const setSelectedAgenteId = (value: string) => {
    setFilters(prev => ({ ...prev, selectedAgenteId: value || undefined }))
    setCurrentPage(1)
    // Limpa tipos disponíveis quando desmarca agente (Admin)
    if (!value && user?.perfil === 'ADMIN') {
      setAvailableTypes([])
      setTipoFluxo(null)
    }
    queryClient.invalidateQueries({ queryKey: ['kanban-boards-agente'] })
    queryClient.invalidateQueries({ queryKey: ['kanban-boards-agente-all'] })
    queryClient.invalidateQueries({ queryKey: getLeadsQueryKey() })
  }
  
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
  const [formData, setFormData] = useState<CreateKanbanBoardDto>({
    nome: '',
    cor_hex: '#ADF0C7',
    tipo: KanbanBoardType.AGENTE,
    colaborador_id: undefined,
    kanban_modelo_id: undefined,
  })
  const [agentes, setAgentes] = useState<any[]>([])
  const [colaboradores, setColaboradores] = useState<any[]>([])
  const [modelos, setModelos] = useState<any[]>([])

  // Busca agentes (apenas se Admin)
  useEffect(() => {
    if (user?.perfil === 'ADMIN') {
      api.get('/users/agentes').then((res) => setAgentes(res.data))
    }
  }, [user])

  // Busca colaboradores do agente selecionado
  useEffect(() => {
    const agenteId = user?.perfil === 'ADMIN' ? selectedAgenteId : user?.id
    if (agenteId) {
      api.get(`/users/colaboradores?agente_id=${agenteId}`).then((res) => {
        setColaboradores(res.data)
      })
    }
  }, [selectedAgenteId, user])

  // Busca modelos
  useEffect(() => {
    api.get('/kanban-modelos')
      .then((res) => setModelos(res.data))
      .catch((error) => {
        console.error('Erro ao carregar modelos:', error)
        // Não precisa mostrar toast aqui, o interceptor já faz isso
        setModelos([])
      })
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

  // Busca todos os boards (sem filtro tipo_fluxo) para determinar tipos disponíveis
  const { data: allBoards = [] } = useQuery<BoardWithLeadsCount[]>({
    queryKey: ['kanban-boards-agente-all', selectedAgenteId],
    queryFn: async () => {
      const params = user?.perfil === 'ADMIN' && selectedAgenteId 
        ? `?agente_id=${selectedAgenteId}` 
        : ''
      const response = await api.get(`/kanban-boards/agente${params}`)
      return response.data
    },
    enabled: user?.perfil === 'AGENTE' || (user?.perfil === 'ADMIN' && !!selectedAgenteId),
  })

  // Determina tipos disponíveis baseado nos boards
  useEffect(() => {
    if (allBoards.length > 0 && modelos.length > 0) {
      const tipos: ('COMPRADOR' | 'VENDEDOR')[] = []
      
      // Verifica cada board para determinar seu tipo_fluxo
      allBoards.forEach(board => {
        let boardTipoFluxo: 'COMPRADOR' | 'VENDEDOR' | null = board.tipo_fluxo as 'COMPRADOR' | 'VENDEDOR' | null
        
        // Se não tiver tipo_fluxo no board, busca do modelo
        if (!boardTipoFluxo && board.kanban_modelo_id) {
          const modelo = modelos.find(m => m.kanban_modelo_id === board.kanban_modelo_id)
          if (modelo?.tipo_fluxo) {
            boardTipoFluxo = modelo.tipo_fluxo
          }
        }
        
        if (boardTipoFluxo === 'COMPRADOR' && !tipos.includes('COMPRADOR')) {
          tipos.push('COMPRADOR')
        } else if (boardTipoFluxo === 'VENDEDOR' && !tipos.includes('VENDEDOR')) {
          tipos.push('VENDEDOR')
        }
      })
      
      // Ordena: COMPRADOR primeiro, depois VENDEDOR
      const sortedTipos: ('COMPRADOR' | 'VENDEDOR')[] = []
      if (tipos.includes('COMPRADOR')) sortedTipos.push('COMPRADOR')
      if (tipos.includes('VENDEDOR')) sortedTipos.push('VENDEDOR')
      
      setAvailableTypes(sortedTipos)
      
      // Define default do tipoFluxo se não estiver definido ou se o tipo atual não estiver disponível
      if (sortedTipos.length > 0) {
        if (!tipoFluxo || !sortedTipos.includes(tipoFluxo)) {
          // Default: COMPRADOR se disponível, senão o primeiro disponível
          const defaultTipo = sortedTipos.includes('COMPRADOR') ? 'COMPRADOR' : sortedTipos[0]
          setTipoFluxo(defaultTipo)
        }
      } else {
        setTipoFluxo(null)
      }
    } else if (allBoards.length === 0) {
      // Se não houver boards, limpa tipos disponíveis
      setAvailableTypes([])
      setTipoFluxo(null)
    }
  }, [allBoards, modelos])

  // Busca boards filtrados por tipo_fluxo
  const { data: boards = [], isLoading: boardsLoading } = useQuery<BoardWithLeadsCount[]>({
    queryKey: ['kanban-boards-agente', selectedAgenteId, tipoFluxo],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (user?.perfil === 'ADMIN' && selectedAgenteId) {
        params.append('agente_id', selectedAgenteId)
      }
      if (tipoFluxo) {
        params.append('tipo_fluxo', tipoFluxo)
      }
      const response = await api.get(`/kanban-boards/agente?${params.toString()}`)
      return response.data
    },
    enabled: (user?.perfil === 'AGENTE' || (user?.perfil === 'ADMIN' && !!selectedAgenteId)) && !!tipoFluxo,
  })

  // Busca leads de todos os boards automaticamente
  const boardLeadsQueries = useQuery({
    queryKey: getLeadsQueryKey(boards.map(b => b.id).sort().join(','), filters as FilterLeadsDto, currentPage),
    queryFn: async () => {
      if (boards.length === 0) return {}
      const leadsPromises = boards.map(board => {
        const params = new URLSearchParams()
        params.append('page', currentPage.toString())
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
        return api.get(`/kanban-boards/${board.id}/leads?${params.toString()}`)
          .then(res => ({ boardId: board.id, data: res.data }))
          .catch(() => ({ boardId: board.id, data: { data: [], total: 0, page: currentPage, limit: 50 } }))
      })
      const results = await Promise.all(leadsPromises)
      const leadsMap: Record<number, { data: Lead[]; total: number; page: number }> = {}
      
      // Pega dados anteriores do cache
      const previousData = queryClient.getQueryData<Record<number, { data: Lead[]; total: number; page: number }>>(
        getLeadsQueryKey(boards.map(b => b.id).sort().join(','), filters as FilterLeadsDto, currentPage - 1)
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

  const createBoardMutation = useMutation({
    mutationFn: async (data: CreateKanbanBoardDto) => {
      return api.post('/kanban-boards', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-boards-agente'] })
      queryClient.invalidateQueries({ queryKey: getLeadsQueryKey() })
      setShowCreateModal(false)
      setFormData({
        nome: '',
        cor_hex: '#ADF0C7',
        tipo: KanbanBoardType.AGENTE,
        colaborador_id: undefined,
        kanban_modelo_id: undefined,
      })
      toast.success('Board criado com sucesso!')
    },
  })

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
      await queryClient.invalidateQueries({ queryKey: ['kanban-boards-agente'] })
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
    if (!formData.colaborador_id || !formData.kanban_modelo_id) {
      toast.warning('Preencha todos os campos obrigatórios')
      return
    }
    
    // Determina o agente_id: se Admin, usa o selecionado; se Agente, usa o próprio ID
    const agenteId = user?.perfil === 'ADMIN' 
      ? (selectedAgenteId ? Number(selectedAgenteId) : undefined)
      : (user?.id ? Number(user.id) : undefined)
    
    if (!agenteId) {
      toast.warning('Agente não identificado')
      return
    }
    
    createBoardMutation.mutate({
      ...formData,
      agente_id: agenteId,
      tipo_fluxo: tipoFluxo || undefined,
    })
  }

  const handleExibir = () => {
    if (user?.perfil === 'ADMIN' && !selectedAgenteId) {
      toast.warning('Selecione um Agente para exibir')
      return
    }
    setCurrentPage(1)
    queryClient.invalidateQueries({ queryKey: getLeadsQueryKey() })
  }


  if (boardsLoading) {
    return <div className="kanban-loading">Carregando boards...</div>
  }

  return (
    <div className="kanban-container">
      <div className="kanban-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1>Kanban</h1>
          {/* Botões COMPRADOR/VENDEDOR */}
          {/* Admin: mostra apenas se agente estiver selecionado e tipos disponíveis */}
          {/* Agente: mostra se tipos disponíveis */}
          {((user?.perfil === 'ADMIN' && selectedAgenteId && availableTypes.length > 0) ||
            (user?.perfil === 'AGENTE' && availableTypes.length > 0)) && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {availableTypes.includes('COMPRADOR') && (
                <button
                  onClick={() => {
                    setTipoFluxo('COMPRADOR')
                    setCurrentPage(1)
                    queryClient.invalidateQueries({ queryKey: ['kanban-boards-agente'] })
                    queryClient.invalidateQueries({ queryKey: getLeadsQueryKey() })
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
              )}
              {availableTypes.includes('VENDEDOR') && (
                <button
                  onClick={() => {
                    setTipoFluxo('VENDEDOR')
                    setCurrentPage(1)
                    queryClient.invalidateQueries({ queryKey: ['kanban-boards-agente'] })
                    queryClient.invalidateQueries({ queryKey: getLeadsQueryKey() })
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
              )}
            </div>
          )}
        </div>
        <div className="kanban-header-actions">
          {user?.perfil === 'ADMIN' && (
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
          )}
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
          <button className="btn-exibir" onClick={handleExibir}>Exibir</button>
        </div>
      </div>

      {(!user || user.perfil === 'AGENTE' || (user.perfil === 'ADMIN' && selectedAgenteId)) && (
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
                <div>
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
                  <span className="board-count">
                    {hasAnyFilter && boardLeads[board.id]?.total !== undefined
                      ? `${boardLeads[board.id].total} de ${board.leads_count || 0}`
                      : board.leads_count || 0}
                  </span>
                </div>
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
                        {lead.kanbanStatus && (
                          <div className="card-tags">
                            <span 
                              className="card-tag card-tag-status"
                              style={{ 
                                backgroundColor: lead.kanbanStatus.bg_color || '#e0e0e0',
                                color: lead.kanbanStatus.text_color || '#000'
                              }}
                            >
                              {lead.kanbanStatus.descricao}
                            </span>
                          </div>
                        )}
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
                      const showButton = hasMore && (currentCount >= 50 || filters.nome_razao_social || hasActiveFilters)
                      
                      return showButton ? (
                        <button 
                          className="btn-mostrar-mais"
                          onClick={async () => {
                            const nextPage = currentPage + 1
                            const leadsPromises = boards.map(board => {
                              const params = new URLSearchParams()
                              params.append('page', nextPage.toString())
                              params.append('limit', '50')
                              if (filters.nome_razao_social) {
                                params.append('nome_razao_social', filters.nome_razao_social)
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
                              return api.get(`/kanban-boards/${board.id}/leads?${params.toString()}`)
                                .then(res => ({ boardId: board.id, data: res.data }))
                                .catch(() => ({ boardId: board.id, data: { data: [], total: 0, page: nextPage, limit: 50 } }))
                            })
                            const results = await Promise.all(leadsPromises)
                            
                            const nextQueryKey = getLeadsQueryKey(boards.map(b => b.id).sort().join(','), filters as FilterLeadsDto, nextPage)
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

          <button
            className="btn-add-board"
            onClick={() => setShowCreateModal(true)}
            title="Adicionar novo board"
          >
            +
          </button>
        </div>
      )}

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
              <label>Selecione o Colaborador dono do board</label>
              <select
                value={formData.colaborador_id || ''}
                onChange={(e) => setFormData({ ...formData, colaborador_id: parseInt(e.target.value) })}
              >
                <option value="">Selecione</option>
                {colaboradores.map((colaborador) => (
                  <option key={colaborador.id} value={colaborador.id}>
                    {colaborador.nome}
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
              invalidateQueries={['kanban-board-leads-all-agente']}
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
          invalidateQueries={['kanban-board-leads-all-agente']}
        />
      )}

      {/* Modal de Filtros */}
      <FiltersModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        filters={filters as FilterLeadsDto}
        onFiltersChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
        onApply={() => {
          setCurrentPage(1)
          queryClient.invalidateQueries({ queryKey: ['kanban-board-leads-all-agente'] })
        }}
        onClear={() => {
          setFilters({})
          setCurrentPage(1)
          queryClient.invalidateQueries({ queryKey: ['kanban-board-leads-all-agente'] })
        }}
        agentes={user?.perfil === 'ADMIN' ? agentes : []}
        colaboradores={colaboradores}
        isAdmin={user?.perfil === 'ADMIN'}
        isAgente={user?.perfil === 'AGENTE'}
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
                  setCurrentPage(1)
                  queryClient.invalidateQueries({ queryKey: ['kanban-board-leads-all-agente'] })
                }}
                invalidateQueries={['kanban-board-leads-all-agente']}
                tipoFluxo={selectedBoard?.tipo_fluxo || undefined}
              />
            </div>
          </div>
        )
      })()}
    </div>
  )
}

