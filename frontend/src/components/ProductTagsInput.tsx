import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'
import { Produto } from '../types/produto'
import { toast } from 'react-toastify'
import './ProductTagsInput.css'

interface ProductTagsInputProps {
  value: number[] // Array de produto_id
  onChange: (produtos: number[]) => void
  isAdmin: boolean
  allowCreateNew?: boolean // Permite criar novos produtos (padrão: true se isAdmin, false caso contrário)
}

export default function ProductTagsInput({ value, onChange, isAdmin, allowCreateNew }: ProductTagsInputProps) {
  // Se allowCreateNew não for especificado, usa isAdmin como padrão
  const canCreateNew = allowCreateNew !== undefined ? allowCreateNew && isAdmin : isAdmin
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<Produto[]>([])
  const [selectedProdutos, setSelectedProdutos] = useState<Produto[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [creatingNew, setCreatingNew] = useState(false)
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

  const handleCreateNew = async () => {
    if (!inputValue.trim()) {
      toast.error('Digite o nome do produto')
      return
    }

    if (!canCreateNew) {
      toast.error('Apenas administradores podem criar novos produtos')
      return
    }

    setCreatingNew(true)
    try {
      const response = await api.post('/produtos', {
        descricao: inputValue.trim(),
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

  const hasExactMatch = suggestions.some(
    p => p.descricao.toLowerCase() === inputValue.trim().toLowerCase()
  )
  const showCreateNew = isAdmin && inputValue.trim() && !hasExactMatch && !loading

  // Remove duplicatas antes de renderizar
  const produtosUnicos = selectedProdutos.filter((produto, index, self) =>
    index === self.findIndex(p => p.produto_id === produto.produto_id)
  )

  return (
    <div className="product-tags-input">
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
            <div
              className="product-tags-suggestion-item product-tags-create-new"
              onClick={handleCreateNew}
            >
              {creatingNew ? 'Criando...' : `${inputValue} (+NOVO)`}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

