export interface ProdutoTipo {
  produto_tipo_id: number
  descricao: string
  bg_color: string
  color: string
}

export interface Produto {
  produto_id: number
  descricao: string
  produto_tipo_id: number
  produto_tipo?: ProdutoTipo
}




