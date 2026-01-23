export interface Activity {
  lead_ocorrencia_id: number
  leads_id: number
  ocorrencia_id: number
  produto_id: number
  data: string
  active: boolean
  created_at: string
  created_at_usuarios_id: number
  deleted_at_usuarios_id?: number
  ocorrencia?: {
    ocorrencia_id: number
    descricao: string
  }
  produto?: {
    produto_id: number
    descricao: string
  }
  created_at_usuario?: {
    id: number
    nome: string
    email: string
  }
}

export interface CreateActivityDto {
  data: string
  ocorrencia_id: number
  produto_id: number
}

export interface Ocorrencia {
  ocorrencia_id: number
  descricao: string
}




