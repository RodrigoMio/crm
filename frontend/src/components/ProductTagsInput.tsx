import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'
import { Produto, ProdutoTipo } from '../types/produto'
import { toast } from 'react-toastify'
import ViewAllProductsModal from './ViewAllProductsModal'
import './ProductTagsInput.css'

interface ProductTagsInputProps {
  value: number[] // Array de produto_id
  onChange: (produtos: number[]) => void
  isAdmin: boolean
  allowCreateNew?: boolean // Permite criar novos produtos (padrão: true se isAdmin, false caso contrário)
  showViewAllButton?: boolean // Mostra botão "Ver todos" ao lado do label (padrão: false)
  label?: string // Label do campo (padrão: "Produtos de interesse")
}

export default function ProductTagsInput({ 
  value, 
  onChange, 
  isAdmin, 
  allowCreateNew,
  showViewAllButton = false,
  label = 'Produtos de interesse'
}: ProductTagsInputProps) {
  // Se allowCreateNew não for especificado, usa isAdmin como padrão
  const canCreateNew = allowCreateNew !== undefined ? allowCreateNew && isAdmin : isAdmin
  
  // Debug: log para verificar se pode criar
  useEffect(() => {
    console.log('[ProductTagsInput] canCreateNew:', canCreateNew, 'isAdmin:', isAdmin, 'allowCreateNew:', allowCreateNew)
  }, [canCreateNew, isAdmin, allowCreateNew])
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<Produto[]>([])
  const [selectedProdutos, setSelectedProdutos] = useState<Produto[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [creatingNew, setCreatingNew] = useState(false)
  const [showViewAllModal, setShowViewAllModal] = useState(false)
  const [produtoTipos, setProdutoTipos] = useState<ProdutoTipo[]>([])
  const [loadingTipos, setLoadingTipos] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Busca produtos selecionados quando value muda (apenas para sincronização externa)
  useEffect(() => {
    if (value && value.length > 0) {
      // Verifica quais produtos já temos no estado
      const produtosConhecidosIds = new Set(selectedProdutos.map(p => p.produto_id))
      const produtosParaBuscar = value.filter(id => !produtosConhecidosIds.has(id))
      
      // Se não há produtos para buscar, apenas filtra os que estão em value (remove duplicatas)
      if (produtosParaBuscar.length === 0) {
        setSelectedProdutos(prev => {
          const valueSet = new Set(value)
          // Remove duplicatas e mantém apenas produtos que estão em value
          const produtosUnicos = prev.filter((p, index, self) => 
            valueSet.has(p.produto_id) && 
            index === self.findIndex(prod => prod.produto_id === p.produto_id)
          )
          return produtosUnicos
        })
        return
      }
      
      // Busca apenas os produtos que ainda não temos
      const fetchProdutos = async () => {
        try {
          // Busca todos os produtos (sem filtro de busca para pegar todos)
          const response = await api.get('/produtos?search=')
          const allProdutos = response.data || []
          
          // Filtra pelos IDs que precisamos
          const novosProdutos = allProdutos.filter((p: Produto) =>
            produtosParaBuscar.includes(p.produto_id)
          )
          
          // Adiciona os novos produtos aos já existentes, garantindo que não há duplicatas
          setSelectedProdutos(prev => {
            const produtosExistentesIds = new Set(prev.map((p: Produto) => p.produto_id))
            const produtosExistentes = prev.filter((p: Produto) => value.includes(p.produto_id))
            const produtosNovosSemDuplicatas = novosProdutos.filter(
              (p: Produto) => !produtosExistentesIds.has(p.produto_id)
            )
            return [...produtosExistentes, ...produtosNovosSemDuplicatas]
          })
        } catch (error) {
          console.error('[ProductTagsInput] Erro ao buscar produtos:', error)
        }
      }
      fetchProdutos()
    } else {
      setSelectedProdutos([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Busca sugestões quando input muda (com debounce)
  useEffect(() => {
    if (!inputValue.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const timeoutId = setTimeout(() => {
      searchProdutos(inputValue)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [inputValue])

  // Busca tipos de produto ao montar o componente
  useEffect(() => {
    const fetchTipos = async () => {
      if (!canCreateNew) {
        console.log('[ProductTagsInput] Não pode criar novos produtos, pulando busca de tipos')
        return // Só busca se pode criar novos produtos
      }
      
      setLoadingTipos(true)
      try {
        console.log('[ProductTagsInput] Buscando tipos de produto...')
        const response = await api.get('/produtos/tipos')
        console.log('[ProductTagsInput] Resposta completa:', response)
        console.log('[ProductTagsInput] Resposta data:', response.data)
        console.log('[ProductTagsInput] Tipo de response.data:', typeof response.data)
        console.log('[ProductTagsInput] É array?', Array.isArray(response.data))
        
        // Tenta extrair os tipos de diferentes formatos possíveis
        let tipos: ProdutoTipo[] = []
        if (Array.isArray(response.data)) {
          tipos = response.data
        } else if (response.data && Array.isArray(response.data.data)) {
          tipos = response.data.data
        } else if (response.data && typeof response.data === 'object') {
          // Se for um objeto, tenta pegar qualquer propriedade que seja array
          const keys = Object.keys(response.data)
          for (const key of keys) {
            if (Array.isArray(response.data[key])) {
              tipos = response.data[key]
              break
            }
          }
        }
        
        console.log('[ProductTagsInput] Tipos extraídos:', tipos)
        console.log('[ProductTagsInput] Quantidade de tipos:', tipos.length)
        
        if (tipos.length === 0) {
          console.warn('[ProductTagsInput] Nenhum tipo encontrado na resposta')
        }
        
        setProdutoTipos(tipos)
      } catch (error: any) {
        console.error('[ProductTagsInput] Erro ao buscar tipos de produto:', error)
        console.error('[ProductTagsInput] Status:', error.response?.status)
        console.error('[ProductTagsInput] Status text:', error.response?.statusText)
        console.error('[ProductTagsInput] Erro detalhado:', error.response?.data || error.message)
        console.error('[ProductTagsInput] Stack:', error.stack)
        toast.error('Erro ao carregar tipos de produto')
        setProdutoTipos([])
      } finally {
        setLoadingTipos(false)
      }
    }
    fetchTipos()
  }, [canCreateNew])

  // Fecha sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchProdutos = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSuggestions([])
      return
    }

    setLoading(true)
    try {
      const response = await api.get(`/produtos?search=${encodeURIComponent(searchTerm)}`)
      const produtos = response.data || []
      
      // Filtra produtos já selecionados
      const produtosDisponiveis = produtos.filter(
        (p: Produto) => !value.includes(p.produto_id)
      )
      
      setSuggestions(produtosDisponiveis)
      setShowSuggestions(true)
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProduto = (produto: Produto) => {
    if (!value.includes(produto.produto_id)) {
      // Adiciona o produto ao estado local imediatamente (verificando duplicatas)
      setSelectedProdutos(prev => {
        const jaExiste = prev.some(p => p.produto_id === produto.produto_id)
        if (jaExiste) {
          return prev
        }
        return [...prev, produto]
      })
      // Atualiza o valor no componente pai
      onChange([...value, produto.produto_id])
    }
    setInputValue('')
    setShowSuggestions(false)
  }

  const handleRemoveProduto = (produtoId: number) => {
    // Remove do estado local imediatamente
    setSelectedProdutos(prev => prev.filter(p => p.produto_id !== produtoId))
    // Atualiza o valor no componente pai
    onChange(value.filter(id => id !== produtoId))
  }

  const handleCreateNew = async (produtoTipoId?: number) => {
    if (!inputValue.trim()) {
      toast.error('Digite o nome do produto')
      return
    }

    if (!canCreateNew) {
      toast.error('Apenas administradores podem criar novos produtos')
      return
    }

    // Se não forneceu tipo, usa o primeiro da lista (ou default 1)
    const tipoId = produtoTipoId || produtoTipos[0]?.produto_tipo_id || 1

    setCreatingNew(true)
    try {
      const response = await api.post('/produtos', {
        descricao: inputValue.trim(),
        produto_tipo_id: tipoId,
      })
      const novoProduto = response.data
      handleSelectProduto(novoProduto)
      toast.success('Produto criado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao criar produto:', error)
      toast.error(error.response?.data?.message || 'Erro ao criar produto')
    } finally {
      setCreatingNew(false)
    }
  }

  const handleTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const produtoTipoId = parseInt(e.target.value, 10)
    if (produtoTipoId) {
      handleCreateNew(produtoTipoId)
    }
  }

  const hasExactMatch = suggestions.some(
    p => p.descricao.toLowerCase() === inputValue.trim().toLowerCase()
  )
  const showCreateNew = isAdmin && inputValue.trim() && !hasExactMatch && !loading

  const handleViewAllApply = (productIds: number[]) => {
    onChange(productIds)
  }

  // Remove duplicatas antes de renderizar
  const produtosUnicos = selectedProdutos.filter((produto, index, self) =>
    index === self.findIndex(p => p.produto_id === produto.produto_id)
  )

  return (
    <div className="product-tags-input">
      {showViewAllButton && (
        <div className="product-tags-label-row">
          <label>{label}</label>
          <button
            type="button"
            onClick={() => setShowViewAllModal(true)}
            className="product-tags-view-all-btn"
          >
            Ver todos
          </button>
        </div>
      )}
      <div className="product-tags-container">
        {produtosUnicos.map((produto) => (
          <span key={produto.produto_id} className="product-tag">
            {produto.descricao}
            <button
              type="button"
              onClick={() => handleRemoveProduto(produto.produto_id)}
              className="product-tag-remove"
              aria-label={`Remover ${produto.descricao}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => {
            if (inputValue.trim()) {
              setShowSuggestions(true)
            }
          }}
          placeholder={produtosUnicos.length === 0 ? 'Digite o nome do produto...' : ''}
          className="product-tags-input-field"
        />
      </div>

      {showSuggestions && (suggestions.length > 0 || showCreateNew) && (
        <div ref={suggestionsRef} className="product-tags-suggestions">
          {loading && <div className="product-tags-loading">Buscando...</div>}
          {!loading && suggestions.length > 0 && (
            <>
              {suggestions.map((produto) => (
                <div
                  key={produto.produto_id}
                  className="product-tags-suggestion-item"
                  onClick={() => handleSelectProduto(produto)}
                >
                  {produto.descricao}
                </div>
              ))}
            </>
          )}
          {showCreateNew && (
            <div className="product-tags-suggestion-item product-tags-create-new-inline">
              <span className="product-tags-create-new-text">
                {creatingNew ? 'Criando...' : inputValue}
              </span>
              <select
                className="product-tags-tipo-select"
                onChange={handleTipoChange}
                disabled={creatingNew || loadingTipos}
                onClick={(e) => e.stopPropagation()}
                defaultValue=""
              >
                <option value="" disabled>
                  {loadingTipos ? 'Carregando...' : produtoTipos.length === 0 ? 'Nenhum tipo disponível' : 'Selecione o tipo'}
                </option>
                {produtoTipos.length > 0 ? (
                  produtoTipos.map((tipo) => (
                    <option key={tipo.produto_tipo_id} value={tipo.produto_tipo_id}>
                      {tipo.descricao}
                    </option>
                  ))
                ) : (
                  !loadingTipos && (
                    <option value="" disabled>
                      Nenhum tipo encontrado
                    </option>
                  )
                )}
              </select>
            </div>
          )}
        </div>
      )}

      <ViewAllProductsModal
        isOpen={showViewAllModal}
        onClose={() => setShowViewAllModal(false)}
        selectedProductIds={value}
        onApply={handleViewAllApply}
      />
    </div>
  )
}

