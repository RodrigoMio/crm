import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { Lead, CreateLeadDto, OrigemLead } from '../types/lead'
import { Occurrence, CreateOccurrenceDto, OccurrenceType } from '../types/occurrence'
import { Activity, CreateActivityDto, Ocorrencia } from '../types/activity'
import { Produto } from '../types/produto'
import { useAuth } from '../contexts/AuthContext'
import ProductTagsInput from './ProductTagsInput'
import './OccurrencesModal.css'

interface EditViewLeadModalProps {
  lead: Lead
  leadName?: string
  onClose: () => void
  onSuccess?: () => void
  invalidateQueries?: string[]
}

export default function EditViewLeadModal({ 
  lead, 
  leadName,
  onClose, 
  onSuccess,
  invalidateQueries = ['leads']
}: EditViewLeadModalProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'lead' | 'ocorrencias' | 'historico' | 'atividades'>('lead')
  
  // Estados para edição do lead
  const [whatsappNumbers, setWhatsappNumbers] = useState<string[]>([])
  const [kanbanStatusChecks, setKanbanStatusChecks] = useState<{ comprador: boolean; vendedor: boolean }>({
    comprador: false,
    vendedor: false,
  })
  const [tipoLeadErrors, setTipoLeadErrors] = useState<{ comprador?: string; vendedor?: string }>({})

  // Estados para ocorrências
  const [newOccurrenceText, setNewOccurrenceText] = useState('')
  
  // Estados para formulário de atividade
  const [activityData, setActivityData] = useState<string>(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [activityOcorrenciaId, setActivityOcorrenciaId] = useState<number | ''>('')
  const [activityProdutoId, setActivityProdutoId] = useState<number | ''>('')

  // Busca o lead completo com produtos quando o modal abre
  // Trata erros 403 silenciosamente (permissão negada) pois o modal pode funcionar com os dados do lead já passados
  const { data: fullLead } = useQuery<Lead>({
    queryKey: ['lead', lead.id],
    queryFn: async () => {
      try {
        const response = await api.get(`/leads/${lead.id}`)
        return response.data
      } catch (error: any) {
        // Se for erro 403 (permissão negada), retorna null silenciosamente
        // O modal continuará funcionando com os dados do lead passado como prop
        if (error.response?.status === 403) {
          return null
        }
        throw error
      }
    },
    enabled: !!lead.id,
    retry: false,
  })

  // Verifica status de kanban para COMPRADOR e VENDEDOR
  // Trata erros 403 silenciosamente
  const { data: kanbanStatusComprador } = useQuery<{ hasStatus: boolean }>({
    queryKey: ['lead-kanban-status', lead.id, 'COMPRADOR'],
    queryFn: async () => {
      try {
        const response = await api.get(`/leads/${lead.id}/kanban-status/COMPRADOR`)
        return response.data
      } catch (error: any) {
        // Se for erro 403, retorna false silenciosamente
        if (error.response?.status === 403) {
          return { hasStatus: false }
        }
        throw error
      }
    },
    enabled: !!lead.id,
    retry: false,
  })

  const { data: kanbanStatusVendedor } = useQuery<{ hasStatus: boolean }>({
    queryKey: ['lead-kanban-status', lead.id, 'VENDEDOR'],
    queryFn: async () => {
      try {
        const response = await api.get(`/leads/${lead.id}/kanban-status/VENDEDOR`)
        return response.data
      } catch (error: any) {
        // Se for erro 403, retorna false silenciosamente
        if (error.response?.status === 403) {
          return { hasStatus: false }
        }
        throw error
      }
    },
    enabled: !!lead.id,
    retry: false,
  })

  // Usa o lead completo se disponível, senão usa o lead passado como prop
  const leadWithProducts = fullLead || lead

  const [formData, setFormData] = useState<CreateLeadDto>({
    data_entrada: leadWithProducts.data_entrada,
    nome_razao_social: leadWithProducts.nome_razao_social,
    nome_fantasia_apelido: leadWithProducts.nome_fantasia_apelido,
    telefone: leadWithProducts.telefone,
    email: leadWithProducts.email,
    uf: leadWithProducts.uf,
    municipio: leadWithProducts.municipio,
    anotacoes: leadWithProducts.anotacoes,
    origem_lead: leadWithProducts.origem_lead,
    vendedor_id: leadWithProducts.vendedor_id,
    usuario_id_colaborador: leadWithProducts.usuario_id_colaborador,
    produtos: leadWithProducts.produtos?.map(p => p.produto_id) || [],
    tipo_lead: leadWithProducts.tipo_lead || [],
  })

  // Atualiza formData quando o lead completo é carregado
  useEffect(() => {
    if (leadWithProducts) {
      const produtosIds = leadWithProducts.produtos?.map(p => p.produto_id) || []
      
      setFormData({
        data_entrada: leadWithProducts.data_entrada,
        nome_razao_social: leadWithProducts.nome_razao_social,
        nome_fantasia_apelido: leadWithProducts.nome_fantasia_apelido,
        telefone: leadWithProducts.telefone,
        email: leadWithProducts.email,
        uf: leadWithProducts.uf,
        municipio: leadWithProducts.municipio,
        anotacoes: leadWithProducts.anotacoes,
        origem_lead: leadWithProducts.origem_lead,
        vendedor_id: leadWithProducts.vendedor_id,
        usuario_id_colaborador: leadWithProducts.usuario_id_colaborador,
        produtos: produtosIds,
        tipo_lead: leadWithProducts.tipo_lead || [],
      })
    }
  }, [leadWithProducts])

  // Atualiza status de kanban quando os dados são carregados
  useEffect(() => {
    setKanbanStatusChecks({
      comprador: kanbanStatusComprador?.hasStatus || false,
      vendedor: kanbanStatusVendedor?.hasStatus || false,
    })
  }, [kanbanStatusComprador, kanbanStatusVendedor])

  // Função para extrair e validar números de telefone
  const extractValidPhoneNumbers = (phoneString: string | undefined): string[] => {
    if (!phoneString) return []
    
    const hasValidSeparator = /[+,;]/.test(phoneString)
    
    if (!hasValidSeparator) {
      let cleaned = phoneString.replace(/\D/g, '')
      
      if (cleaned.startsWith('55') && cleaned.length > 12) {
        cleaned = cleaned.substring(2)
      }
      
      if (cleaned.length >= 10 && cleaned.length <= 13) {
        return [cleaned]
      }
      
      return []
    }
    
    const phoneList = phoneString.split(/[+,;]/).filter(phone => phone.trim())
    
    const validNumbers: string[] = []
    
    phoneList.forEach(phone => {
      let cleaned = phone.replace(/\D/g, '')
      
      if (cleaned.startsWith('55') && cleaned.length > 12) {
        cleaned = cleaned.substring(2)
      }
      
      if (cleaned.length >= 10 && cleaned.length <= 13) {
        validNumbers.push(cleaned)
      }
    })
    
    return validNumbers
  }

  // Função para normalizar número para o link do WhatsApp
  const normalizePhoneForWhatsApp = (phoneNumber: string): string => {
    let cleaned = phoneNumber.replace(/\D/g, '')
    
    if (cleaned.startsWith('55') && cleaned.length > 12) {
      cleaned = cleaned.substring(2)
    }
    
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned
    }
    
    return cleaned
  }

  // Função para gerar link do WhatsApp
  const getWhatsAppLink = (phoneNumber: string): string => {
    const normalized = normalizePhoneForWhatsApp(phoneNumber)
    return `https://wa.me/${normalized}`
  }

  // Atualiza números do WhatsApp quando o telefone muda
  useEffect(() => {
    const validNumbers = extractValidPhoneNumbers(formData.telefone)
    setWhatsappNumbers(validNumbers)
  }, [formData.telefone])

  // Mutation para atualizar lead
  const updateLeadMutation = useMutation({
    mutationFn: async (data: CreateLeadDto) => {
      return api.patch(`/leads/${leadWithProducts.id}`, data)
    },
    onSuccess: () => {
      invalidateQueries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey: [queryKey] })
      })
      queryClient.invalidateQueries({ queryKey: ['kanban-board-leads-all'] })
      queryClient.invalidateQueries({ queryKey: ['kanban-board-leads-all-agente'] })
      queryClient.invalidateQueries({ queryKey: ['kanban-board-leads-all-colaborador'] })
      queryClient.invalidateQueries({ queryKey: ['lead', lead.id] })
      toast.success('Lead atualizado com sucesso!')
    },
  })

  const handleLeadSubmit = (e: React.FormEvent, shouldClose: boolean = false) => {
    e.preventDefault()
    
    if (!formData.tipo_lead || formData.tipo_lead.length === 0) {
      setTipoLeadErrors({ comprador: 'Selecione pelo menos uma opção' })
      return
    }
    
    setTipoLeadErrors({})
    
    const dataToSend: any = { ...formData }
    delete dataToSend.vendedor_id
    delete dataToSend.usuario_id_colaborador
    
    updateLeadMutation.mutate(dataToSend, {
      onSuccess: () => {
        if (shouldClose) {
          onSuccess?.()
          onClose()
        }
      }
    })
  }

  const handleTipoLeadChange = (tipo: 'COMPRADOR' | 'VENDEDOR', checked: boolean) => {
    if (!checked) {
      if (tipo === 'COMPRADOR' && kanbanStatusChecks.comprador) {
        setTipoLeadErrors({
          ...tipoLeadErrors,
          comprador: 'Lead ativo como COMPRADOR. Não é possível desmarcar',
        })
        return
      }
      if (tipo === 'VENDEDOR' && kanbanStatusChecks.vendedor) {
        setTipoLeadErrors({
          ...tipoLeadErrors,
          vendedor: 'Lead ativo como VENDEDOR. Não é possível desmarcar',
        })
        return
      }
    }

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

  // Busca ocorrências do lead
  // Trata erros 403 silenciosamente (permissão negada)
  const { data: occurrences = [], isLoading: isLoadingOccurrences } = useQuery<Occurrence[]>({
    queryKey: ['occurrences', lead.id],
    queryFn: async () => {
      try {
        const response = await api.get(`/leads/${lead.id}/occurrences`)
        return response.data
      } catch (error: any) {
        // Se for erro 403 (permissão negada), retorna array vazio silenciosamente
        if (error.response?.status === 403) {
          return []
        }
        throw error
      }
    },
    retry: false,
  })

  // Mutation para criar ocorrência
  const createOccurrenceMutation = useMutation({
    mutationFn: async (data: CreateOccurrenceDto) => {
      return api.post(`/leads/${lead.id}/occurrences`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occurrences', lead.id] })
      setNewOccurrenceText('')
      toast.success('Ocorrência criada com sucesso!')
    },
    onError: (error: any) => {
      console.error('Erro ao criar ocorrência:', error)
    },
  })

  // Mutation para excluir ocorrência
  const deleteOccurrenceMutation = useMutation({
    mutationFn: async (occurrenceId: number) => {
      return api.delete(`/leads/${lead.id}/occurrences/${occurrenceId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occurrences', lead.id] })
      toast.success('Ocorrência excluída com sucesso!')
    },
    onError: (error: any) => {
      console.error('Erro ao excluir ocorrência:', error)
    },
  })

  const handleOccurrenceSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOccurrenceText.trim()) {
      toast.warning('Por favor, informe o texto da ocorrência')
      return
    }
    createOccurrenceMutation.mutate({
      texto: newOccurrenceText.trim(),
      tipo: OccurrenceType.SISTEMA,
    })
  }

  const canDeleteOccurrence = (occurrence: Occurrence): boolean => {
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
  // Trata erros 403 silenciosamente (permissão negada)
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery<Activity[]>({
    queryKey: ['activities', lead.id],
    queryFn: async () => {
      try {
        const response = await api.get(`/leads/${lead.id}/activities`)
        return response.data
      } catch (error: any) {
        // Se for erro 403 (permissão negada), retorna array vazio silenciosamente
        if (error.response?.status === 403) {
          return []
        }
        throw error
      }
    },
    enabled: activeTab === 'atividades',
    retry: false,
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
      return api.post(`/leads/${lead.id}/activities`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', lead.id] })
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
      return api.delete(`/leads/${lead.id}/activities/${activityId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', lead.id] })
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
    if (user?.perfil === 'ADMIN') {
      return true
    }

    const userId = typeof user?.id === 'string' ? parseInt(user.id, 10) : user?.id
    if (activity.created_at_usuarios_id !== userId) {
      return false
    }

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
    
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = text.split(urlRegex)
    
    return parts.map((part, index) => {
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

  const displayName = leadName || leadWithProducts.nome_fantasia_apelido || leadWithProducts.nome_razao_social
  const leadMsgInteresse = (leadWithProducts as any).lead_msg_interesse || ''
  const origemLeadOptions = Object.values(OrigemLead)
  const origemSelecionada = formData.origem_lead || ''
  const origemOptions = origemSelecionada && !origemLeadOptions.includes(origemSelecionada as OrigemLead)
    ? [origemSelecionada, ...origemLeadOptions]
    : origemLeadOptions
  const formatLabel = (value: string) =>
    value
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ')

  return (
    <div className="occurrences-modal-overlay" onClick={onClose}>
      <div className="occurrences-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="occurrences-modal-header">
          <h2>{displayName}</h2>
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
              className={`occurrences-tab ${activeTab === 'lead' ? 'active' : ''}`}
              onClick={() => setActiveTab('lead')}
            >
              Lead
            </button>
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

          {/* Conteúdo da aba Lead */}
          {activeTab === 'lead' && (
            <div className="occurrences-tab-content">
              <form onSubmit={(e) => handleLeadSubmit(e, false)} className="lead-edit-form">
                {/* Linha 1: Nome/Razão Social (2 colunas) + Nome Fantasia/Apelido (2 colunas) */}
                <div className="lead-edit-grid lead-edit-grid-2">
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                      Nome/Razão Social *
                    </label>
                    <input
                      type="text"
                      value={formData.nome_razao_social}
                      onChange={(e) => setFormData({ ...formData, nome_razao_social: e.target.value })}
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
                      Nome Fantasia/Apelido
                    </label>
                    <input
                      type="text"
                      value={formData.nome_fantasia_apelido || ''}
                      onChange={(e) => setFormData({ ...formData, nome_fantasia_apelido: e.target.value })}
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
                </div>

                {/* Linha 2: Telefone (2 colunas) + Email (2 colunas) */}
                <div className="lead-edit-grid lead-edit-grid-2">
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={formData.telefone || ''}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                      }}
                    />
                    {/* Botões do WhatsApp */}
                    {whatsappNumbers.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        {whatsappNumbers.map((phoneNumber, index) => (
                          <a
                            key={index}
                            href={getWhatsAppLink(phoneNumber)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem 1rem',
                              backgroundColor: '#25D366',
                              color: '#000000',
                              textDecoration: 'none',
                              borderRadius: '4px',
                              fontSize: '0.9rem',
                              fontWeight: '500',
                              transition: 'background-color 0.2s',
                              width: 'fit-content'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#20BA5A'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#25D366'
                            }}
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              style={{ flexShrink: 0 }}
                            >
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                            <span>{phoneNumber}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                </div>

                {/* Linha 3: Produtos de interesse (2 colunas) + Tipo de Lead (2 colunas) */}
                <div className="lead-edit-grid lead-edit-grid-2">
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                      Produtos de interesse
                    </label>
                    <ProductTagsInput
                      value={formData.produtos || []}
                      onChange={(produtos) => setFormData({ ...formData, produtos })}
                      isAdmin={user?.perfil === 'ADMIN'}
                      showViewAllButton={true}
                      label=""
                      lockedIds={(leadWithProducts?.produtos || []).filter((p: any) => p.insert_by_lead).map((p: any) => p.produto_id)}
                      lockedTooltip="Produto selecionado pelo Lead na Landing Page. Remoção desabilitada."
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                      Tipo de Lead *
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '1.5rem', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: kanbanStatusChecks.comprador ? 'not-allowed' : 'pointer', userSelect: 'none' }}>
                        <input
                          type="checkbox"
                          checked={formData.tipo_lead?.includes('COMPRADOR') || false}
                          onChange={(e) => handleTipoLeadChange('COMPRADOR', e.target.checked)}
                          disabled={kanbanStatusChecks.comprador}
                          style={{ 
                            width: '18px', 
                            height: '18px', 
                            minWidth: '18px', 
                            minHeight: '18px',
                            cursor: kanbanStatusChecks.comprador ? 'not-allowed' : 'pointer', 
                            margin: 0,
                            marginRight: '8px',
                            flexShrink: 0
                          }}
                        />
                        <span>COMPRADOR</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: kanbanStatusChecks.vendedor ? 'not-allowed' : 'pointer', userSelect: 'none' }}>
                        <input
                          type="checkbox"
                          checked={formData.tipo_lead?.includes('VENDEDOR') || false}
                          onChange={(e) => handleTipoLeadChange('VENDEDOR', e.target.checked)}
                          disabled={kanbanStatusChecks.vendedor}
                          style={{ 
                            width: '18px', 
                            height: '18px', 
                            minWidth: '18px', 
                            minHeight: '18px',
                            cursor: kanbanStatusChecks.vendedor ? 'not-allowed' : 'pointer', 
                            margin: 0,
                            marginRight: '8px',
                            flexShrink: 0
                          }}
                        />
                        <span>VENDEDOR</span>
                      </label>
                    </div>
                    {kanbanStatusChecks.comprador && (
                      <small style={{ color: '#ff9800', marginTop: '0.25rem', display: 'block' }}>
                        Lead ativo como COMPRADOR. Não é possível desmarcar
                      </small>
                    )}
                    {kanbanStatusChecks.vendedor && (
                      <small style={{ color: '#ff9800', marginTop: '0.25rem', display: 'block' }}>
                        Lead ativo como VENDEDOR. Não é possível desmarcar
                      </small>
                    )}
                    {tipoLeadErrors.comprador && !kanbanStatusChecks.comprador && (
                      <small style={{ color: '#d32f2f', marginTop: '0.25rem', display: 'block' }}>
                        {tipoLeadErrors.comprador}
                      </small>
                    )}
                    {tipoLeadErrors.vendedor && !kanbanStatusChecks.vendedor && (
                      <small style={{ color: '#d32f2f', marginTop: '0.25rem', display: 'block' }}>
                        {tipoLeadErrors.vendedor}
                      </small>
                    )}
                    {tipoLeadErrors.comprador && tipoLeadErrors.comprador.includes('Selecione') && (
                      <small style={{ color: '#d32f2f', marginTop: '0.25rem', display: 'block' }}>
                        {tipoLeadErrors.comprador}
                      </small>
                    )}
                  </div>
                </div>

                {/* Linha 4: Data de entrada (1 coluna) + UF (1 coluna) + Município (1 coluna) */}
                <div className="lead-edit-grid lead-edit-grid-3">
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                      Data de Entrada *
                    </label>
                    <input
                      type="date"
                      value={formData.data_entrada || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setFormData({ ...formData, data_entrada: e.target.value })}
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
                      UF
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={formData.uf || ''}
                      onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
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
                      Município
                    </label>
                    <input
                      type="text"
                      value={formData.municipio || ''}
                      onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
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
                </div>

                <div className="lead-edit-grid lead-edit-grid-2">
                  <div>
                    <label className="lead-edit-label">Origem do Lead</label>
                    <select
                      value={origemSelecionada}
                      onChange={(e) => setFormData({ ...formData, origem_lead: e.target.value || undefined })}
                      className="lead-edit-input"
                    >
                      <option value="">Selecione...</option>
                      {origemOptions.map((origem) => (
                        <option key={origem} value={origem}>
                          {formatLabel(origem)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="lead-edit-label">Texto de interesse do Lead</label>
                    <textarea
                      value={leadMsgInteresse}
                      rows={3}
                      disabled
                      className="lead-edit-input lead-edit-input-readonly"
                    />
                  </div>
                </div>

                {/* Linha 5: Anotações */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                    Anotações
                  </label>
                  <textarea
                    value={formData.anotacoes || ''}
                    onChange={(e) => setFormData({ ...formData, anotacoes: e.target.value })}
                    rows={5}
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
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button type="button" onClick={onClose} className="btn-secondary">
                    Cancelar
                  </button>
                  <button 
                    type="button" 
                    onClick={(e) => handleLeadSubmit(e, false)} 
                    disabled={updateLeadMutation.isPending} 
                    className="btn-primary"
                  >
                    {updateLeadMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button 
                    type="button" 
                    onClick={(e) => handleLeadSubmit(e, true)} 
                    disabled={updateLeadMutation.isPending} 
                    className="btn-primary"
                  >
                    {updateLeadMutation.isPending ? 'Salvando...' : 'Salvar e Fechar'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Conteúdo da aba Ocorrências */}
          {activeTab === 'ocorrencias' && (
            <div className="occurrences-tab-content">
              {/* Formulário de nova ocorrência */}
              <div className="occurrences-form">
                <h3>Nova ocorrência</h3>
                <form onSubmit={handleOccurrenceSubmit}>
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
                    disabled={createOccurrenceMutation.isPending || !newOccurrenceText.trim()}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: createOccurrenceMutation.isPending || !newOccurrenceText.trim() ? 'not-allowed' : 'pointer',
                      opacity: createOccurrenceMutation.isPending || !newOccurrenceText.trim() ? 0.6 : 1,
                    }}
                  >
                    {createOccurrenceMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </button>
                </form>
              </div>

              {/* Lista de ocorrências do tipo USUARIO */}
              <div className="occurrences-list">
                <h3>Ocorrências</h3>
                {isLoadingOccurrences ? (
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
                              {canDeleteOccurrence(occurrence) && (
                                <button
                                  onClick={() => {
                                    if (confirm('Tem certeza que deseja excluir esta ocorrência?')) {
                                      deleteOccurrenceMutation.mutate(occurrence.id)
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
                {isLoadingOccurrences ? (
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
