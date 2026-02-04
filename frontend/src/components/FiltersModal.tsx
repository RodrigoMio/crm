import { useState, useEffect } from 'react'
import { FilterLeadsDto, OrigemLead } from '../types/lead'
import ProductTagsInput from './ProductTagsInput'
import UFTagsInput from './UFTagsInput'
import './FiltersModal.css'

interface FiltersModalProps {
  isOpen: boolean
  onClose: () => void
  filters: FilterLeadsDto
  onFiltersChange: (filters: FilterLeadsDto) => void
  onApply: () => void
  onClear: () => void
  agentes?: Array<{ id: number; nome: string }>
  colaboradores?: Array<{ id: number; nome: string }>
  isAdmin: boolean
  isAgente: boolean
}

export default function FiltersModal({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onApply,
  onClear,
  agentes = [],
  colaboradores = [],
  isAdmin,
  isAgente,
}: FiltersModalProps) {
  const [localFilters, setLocalFilters] = useState<FilterLeadsDto>(filters)

  // Sincroniza filtros locais quando os filtros externos mudam (especialmente ao abrir o modal)
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters)
    }
  }, [isOpen, filters])

  const handleFilterChange = (updates: Partial<FilterLeadsDto>) => {
    setLocalFilters((prev) => ({ ...prev, ...updates }))
  }

  const handleApply = () => {
    onFiltersChange(localFilters)
    onApply()
    onClose()
  }

  const handleClear = () => {
    const emptyFilters: FilterLeadsDto = {}
    setLocalFilters(emptyFilters)
    onFiltersChange(emptyFilters)
    onClear()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="filters-modal-overlay" onClick={onClose}>
      <div className="filters-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="filters-modal-header">
          <h2>Filtros</h2>
          <button
            onClick={onClose}
            className="filters-modal-close"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        <div className="filters filters-mobile">
          <div className="filter-group">
            <label>Nome/Razão Social</label>
            <input
              type="text"
              value={localFilters.nome_razao_social || ''}
              onChange={(e) =>
                handleFilterChange({ nome_razao_social: e.target.value || undefined })
              }
              placeholder="Buscar por nome..."
            />
          </div>

          <div className="filter-group" style={{ gridColumn: 'span 2', minWidth: '300px' }}>
            <ProductTagsInput
              value={localFilters.produtos || []}
              onChange={(produtos) => handleFilterChange({ produtos: produtos.length > 0 ? produtos : undefined })}
              isAdmin={isAdmin}
              allowCreateNew={isAdmin}
              showViewAllButton={true}
              label="Produtos de interesse"
            />
          </div>

          <div className="filter-group">
            <label>UF</label>
            <UFTagsInput
              value={Array.isArray(localFilters.uf) ? localFilters.uf : localFilters.uf ? [localFilters.uf] : []}
              onChange={(ufs) => handleFilterChange({ uf: ufs.length > 0 ? ufs : undefined })}
            />
          </div>

          <div className="filter-group">
            <label>Origem do Lead</label>
            <select
              value={localFilters.origem_lead || ''}
              onChange={(e) =>
                handleFilterChange({ origem_lead: e.target.value ? (e.target.value as OrigemLead) : undefined })
              }
            >
              <option value="">Todas</option>
              {Object.values(OrigemLead).map((origem) => (
                <option key={origem} value={origem}>
                  {origem.split('_').map((word) => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
                </option>
              ))}
            </select>
          </div>

          {isAdmin && (
            <div className="filter-group">
              <label>Vendedor</label>
              <select
                value={localFilters.vendedor_id || ''}
                onChange={(e) =>
                  handleFilterChange({ vendedor_id: e.target.value || undefined })
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

          {isAgente && (
            <div className="filter-group">
              <label>Colaborador</label>
              <select
                value={localFilters.usuario_id_colaborador?.toString() || ''}
                onChange={(e) =>
                  handleFilterChange({ 
                    usuario_id_colaborador: e.target.value ? Number(e.target.value) : undefined 
                  })
                }
              >
                <option value="">Todos</option>
                {colaboradores.map((colaborador) => (
                  <option key={colaborador.id} value={colaborador.id}>
                    {colaborador.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="filter-group">
            <label>Limpar filtro</label>
            <button 
              onClick={handleClear} 
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
        <div className="filters-modal-actions">
          <button
            onClick={handleApply}
            className="btn-primary"
            style={{ width: '100%' }}
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  )
}

