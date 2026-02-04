import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import { Lead, CreateLeadDto } from '../types/lead'
import { useAuth } from '../contexts/AuthContext'
import ProductTagsInput from './ProductTagsInput'

interface EditLeadModalProps {
  lead: Lead
  onClose: () => void
  onSuccess?: () => void
  invalidateQueries?: string[]
}

export default function EditLeadModal({ 
  lead, 
  onClose, 
  onSuccess,
  invalidateQueries = ['leads']
}: EditLeadModalProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [whatsappNumbers, setWhatsappNumbers] = useState<string[]>([])
  const [kanbanStatusChecks, setKanbanStatusChecks] = useState<{ comprador: boolean; vendedor: boolean }>({
    comprador: false,
    vendedor: false,
  })
  const [tipoLeadErrors, setTipoLeadErrors] = useState<{ comprador?: string; vendedor?: string }>({})

  // Busca o lead completo com produtos quando o modal abre
  const { data: fullLead } = useQuery<Lead>({
    queryKey: ['lead', lead.id],
    queryFn: async () => {
      const response = await api.get(`/leads/${lead.id}`)
      return response.data
    },
    enabled: !!lead.id,
  })

  // Verifica status de kanban para COMPRADOR e VENDEDOR
  const { data: kanbanStatusComprador } = useQuery<{ hasStatus: boolean }>({
    queryKey: ['lead-kanban-status', lead.id, 'COMPRADOR'],
    queryFn: async () => {
      const response = await api.get(`/leads/${lead.id}/kanban-status/COMPRADOR`)
      return response.data
    },
    enabled: !!lead.id,
  })

  const { data: kanbanStatusVendedor } = useQuery<{ hasStatus: boolean }>({
    queryKey: ['lead-kanban-status', lead.id, 'VENDEDOR'],
    queryFn: async () => {
      const response = await api.get(`/leads/${lead.id}/kanban-status/VENDEDOR`)
      return response.data
    },
    enabled: !!lead.id,
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
    
    // Verifica se há pelo menos um separador válido (+, , ou ;)
    const hasValidSeparator = /[+,;]/.test(phoneString)
    
    // Se não tiver separador válido, verifica se é um único número válido
    if (!hasValidSeparator) {
      // Remove TODOS os caracteres não numéricos
      let cleaned = phoneString.replace(/\D/g, '')
      
      // Remove o código do Brasil (55) se estiver no início e o número tiver mais de 12 dígitos
      if (cleaned.startsWith('55') && cleaned.length > 12) {
        cleaned = cleaned.substring(2)
      }
      
      // Valida se tem entre 10 e 13 dígitos (aceita números com código do país)
      if (cleaned.length >= 10 && cleaned.length <= 13) {
        return [cleaned]
      }
      
      // Se não tiver separador válido e não for um número válido, retorna vazio
      return []
    }
    
    // Separa APENAS por +, , ou ; (espaços NÃO são separadores válidos)
    const phoneList = phoneString.split(/[+,;]/).filter(phone => phone.trim())
    
    const validNumbers: string[] = []
    
    phoneList.forEach(phone => {
      // Remove TODOS os caracteres não numéricos, mantendo apenas dígitos
      let cleaned = phone.replace(/\D/g, '')
      
      // Remove o código do Brasil (55) se estiver no início e o número tiver mais de 12 dígitos
      if (cleaned.startsWith('55') && cleaned.length > 12) {
        cleaned = cleaned.substring(2)
      }
      
      // Valida se tem entre 10 e 13 dígitos (aceita números com código do país)
      if (cleaned.length >= 10 && cleaned.length <= 13) {
        // Armazena apenas os dígitos para exibição
        validNumbers.push(cleaned)
      }
    })
    
    return validNumbers
  }

  // Função para normalizar número para o link do WhatsApp
  const normalizePhoneForWhatsApp = (phoneNumber: string): string => {
    // Remove todos os caracteres não numéricos
    let cleaned = phoneNumber.replace(/\D/g, '')
    
    // Remove o código do Brasil (55) se estiver no início
    if (cleaned.startsWith('55') && cleaned.length > 12) {
      cleaned = cleaned.substring(2)
    }
    
    // Adiciona o código do Brasil se não tiver
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


  const mutation = useMutation({
    mutationFn: async (data: CreateLeadDto) => {
      return api.patch(`/leads/${leadWithProducts.id}`, data)
    },
    onSuccess: () => {
      // Invalida as queries especificadas
      invalidateQueries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey: [queryKey] })
      })
      // Também invalida queries relacionadas ao Kanban
      queryClient.invalidateQueries({ queryKey: ['kanban-board-leads-all'] })
      queryClient.invalidateQueries({ queryKey: ['kanban-board-leads-all-agente'] })
      queryClient.invalidateQueries({ queryKey: ['kanban-board-leads-all-colaborador'] })
      onSuccess?.()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação: pelo menos um tipo de lead deve estar selecionado
    if (!formData.tipo_lead || formData.tipo_lead.length === 0) {
      setTipoLeadErrors({ comprador: 'Selecione pelo menos uma opção' })
      return
    }
    
    setTipoLeadErrors({})
    
    // Remove vendedor_id e usuario_id_colaborador do payload (campos readonly)
    const dataToSend: any = { ...formData }
    delete dataToSend.vendedor_id
    delete dataToSend.usuario_id_colaborador
    
    mutation.mutate(dataToSend)
  }

  const handleTipoLeadChange = (tipo: 'COMPRADOR' | 'VENDEDOR', checked: boolean) => {
    // Verifica se pode desmarcar
    if (!checked) {
      if (tipo === 'COMPRADOR' && kanbanStatusChecks.comprador) {
        setTipoLeadErrors({
          ...tipoLeadErrors,
          comprador: 'Lead ativo como VENDEDOR. Não é possível desmarcar',
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


  return (
    <div>
      <h2>Editar Lead</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

        {/* Campos Vendedor e Colaborador ocultos */}

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

        <div>
          <label>Nome Fantasia/Apelido</label>
          <input
            type="text"
            value={formData.nome_fantasia_apelido || ''}
            onChange={(e) => setFormData({ ...formData, nome_fantasia_apelido: e.target.value })}
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
            <label>UF</label>
            <input
              type="text"
              maxLength={2}
              value={formData.uf || ''}
              onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          </div>

          <div>
            <label>Município</label>
            <input
              type="text"
              value={formData.municipio || ''}
              onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          </div>
        </div>

        <div>
          <label>Tipo de Lead *</label>
          <div style={{ display: 'flex', flexDirection: 'row', gap: '1.5rem', marginTop: '0.25rem', alignItems: 'center' }}>
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
              Lead ativo como VENDEDOR. Não é possível desmarcar
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

        <div>
          <div style={{ marginTop: '0.25rem' }}>
            <ProductTagsInput
              value={formData.produtos || []}
              onChange={(produtos) => setFormData({ ...formData, produtos })}
              isAdmin={user?.perfil === 'ADMIN'}
              showViewAllButton={true}
              label="Produtos de interesse"
            />
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



