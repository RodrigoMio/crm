import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Produto } from '../types/produto'
import ProductTagsInput from './ProductTagsInput'
import './BulkTagSelectModal.css'

interface BulkTagSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (produtoId: number, produtoDescricao: string) => void
  isAdmin: boolean
  boardName?: string
}

export default function BulkTagSelectModal({
  isOpen,
  onClose,
  onSelect,
  isAdmin,
  boardName = '',
}: BulkTagSelectModalProps) {
  const [selectedProdutoId, setSelectedProdutoId] = useState<number | null>(null)
  const [selectedProdutoDescricao, setSelectedProdutoDescricao] = useState<string>('')

  // Fechar com tecla ESC
  useEffect(() => {
    if (!isOpen) return
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  // Buscar descrição do produto quando selecionado
  useEffect(() => {
    const fetchProdutoDescricao = async () => {
      if (!selectedProdutoId) {
        setSelectedProdutoDescricao('')
        return
      }

      try {
        // Busca todos os produtos e filtra pelo ID selecionado
        // Como não temos endpoint para buscar produto por ID, buscamos todos
        const response = await api.get(`/produtos?search=`)
        const produtos = Array.isArray(response.data) ? response.data : []
        const produto = produtos.find((p: Produto) => p.produto_id === selectedProdutoId)
        if (produto) {
          setSelectedProdutoDescricao(produto.descricao)
        } else {
          // Se não encontrou, tenta buscar novamente após um delay
          setTimeout(() => {
            fetchProdutoDescricao()
          }, 500)
        }
      } catch (error) {
        console.error('Erro ao buscar descrição do produto:', error)
      }
    }

    fetchProdutoDescricao()
  }, [selectedProdutoId])

  const handleProdutoChange = (produtoIds: number[]) => {
    if (produtoIds.length > 0) {
      setSelectedProdutoId(produtoIds[0])
    } else {
      setSelectedProdutoId(null)
      setSelectedProdutoDescricao('')
    }
  }

  const handleConfirm = () => {
    if (selectedProdutoId && selectedProdutoDescricao) {
      onSelect(selectedProdutoId, selectedProdutoDescricao)
      setSelectedProdutoId(null)
      setSelectedProdutoDescricao('')
    }
  }

  if (!isOpen) return null

  return (
    <div className="bulk-tag-select-modal-overlay" onClick={onClose}>
      <div className="bulk-tag-select-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="bulk-tag-select-modal-header">
          <h2>Adicionar/Remover tags para leads do board {boardName}</h2>
          <button
            onClick={onClose}
            className="bulk-tag-select-modal-close"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        <div className="bulk-tag-select-modal-body">
          <div className="bulk-tag-select-form-group">
            <label>Selecione uma Tag</label>
            <ProductTagsInput
              value={selectedProdutoId ? [selectedProdutoId] : []}
              onChange={(produtoIds) => {
                handleProdutoChange(produtoIds)
                if (produtoIds.length > 0) {
                  // Quando um produto é selecionado, buscar sua descrição
                  // Por enquanto, vamos usar o ID e buscar depois
                  setSelectedProdutoId(produtoIds[0])
                }
              }}
              isAdmin={isAdmin}
              allowCreateNew={isAdmin}
              showViewAllButton={false}
              label=""
            />
          </div>
        </div>
        <div className="bulk-tag-select-modal-actions">
          <button
            onClick={onClose}
            className="bulk-tag-select-btn-cancel"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="bulk-tag-select-btn-confirm"
            disabled={!selectedProdutoId || !selectedProdutoDescricao}
          >
            Seguinte
          </button>
        </div>
      </div>
    </div>
  )
}
