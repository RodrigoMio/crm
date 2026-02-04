import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'
import { Produto } from '../types/produto'
import './ViewAllProductsModal.css'

interface ViewAllProductsModalProps {
  isOpen: boolean
  onClose: () => void
  selectedProductIds: number[]
  onApply: (productIds: number[]) => void
}

export default function ViewAllProductsModal({
  isOpen,
  onClose,
  selectedProductIds,
  onApply,
}: ViewAllProductsModalProps) {
  const [allProducts, setAllProducts] = useState<Produto[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Produto[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [localSelectedIds, setLocalSelectedIds] = useState<Set<number>>(new Set(selectedProductIds))
  const [loading, setLoading] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Carrega todos os produtos ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      loadAllProducts()
      setLocalSelectedIds(new Set(selectedProductIds))
      setSearchTerm('')
    }
  }, [isOpen, selectedProductIds])

  // Filtra produtos em tempo real
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(allProducts)
      return
    }

    const normalizedSearch = normalizeText(searchTerm.trim())
    const filtered = allProducts.filter(produto => {
      const normalizedDesc = normalizeText(produto.descricao)
      return normalizedDesc.includes(normalizedSearch)
    })
    setFilteredProducts(filtered)
  }, [searchTerm, allProducts])

  // Normaliza texto removendo acentos e convertendo para minúsculas
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
      .replace(/ç/g, 'c')
      .replace(/ñ/g, 'n')
  }

  const loadAllProducts = async () => {
    setLoading(true)
    try {
      const response = await api.get('/produtos?search=')
      const products = response.data || []
      setAllProducts(products)
      setFilteredProducts(products)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      setAllProducts([])
      setFilteredProducts([])
    } finally {
      setLoading(false)
    }
  }

  const toggleProduct = (productId: number) => {
    setLocalSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  const handleApply = () => {
    onApply(Array.from(localSelectedIds))
    onClose()
  }

  const handleClose = () => {
    setLocalSelectedIds(new Set(selectedProductIds))
    setSearchTerm('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="view-all-products-overlay" onClick={handleClose}>
      <div className="view-all-products-content" onClick={(e) => e.stopPropagation()}>
        <div className="view-all-products-header">
          <h2>Selecionar Produtos</h2>
          <button
            onClick={handleClose}
            className="view-all-products-close"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="view-all-products-body">
          <div className="view-all-products-search">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar produtos..."
              className="view-all-products-search-input"
            />
          </div>

          {loading ? (
            <div className="view-all-products-loading">Carregando produtos...</div>
          ) : (
            <div className="view-all-products-grid">
              {filteredProducts.map((produto) => {
                const isSelected = localSelectedIds.has(produto.produto_id)
                return (
                  <div
                    key={produto.produto_id}
                    className={`view-all-products-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleProduct(produto.produto_id)}
                  >
                    {isSelected && (
                      <span className="view-all-products-item-remove">×</span>
                    )}
                    <span className="view-all-products-item-text">{produto.descricao}</span>
                  </div>
                )
              })}
            </div>
          )}

          {filteredProducts.length === 0 && !loading && (
            <div className="view-all-products-empty">
              {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
            </div>
          )}
        </div>

        <div className="view-all-products-footer">
          <button
            onClick={handleClose}
            className="btn-secondary"
          >
            Fechar
          </button>
          <button
            onClick={handleApply}
            className="btn-primary"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}
