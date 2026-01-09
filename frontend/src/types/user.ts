export enum UserProfile {
  ADMIN = 'ADMIN',
  AGENTE = 'AGENTE',
  COLABORADOR = 'COLABORADOR',
}

export interface User {
  id: string
  nome: string
  email: string
  perfil: UserProfile
  ativo: boolean
  usuario_id_pai?: number
  usuario_pai?: {
    id: number
    nome: string
    email: string
  }
  created_at: string
  updated_at: string
}

export interface CreateUserDto {
  nome: string
  email: string
  senha: string
  perfil: UserProfile
  usuario_id_pai?: number
  ativo?: boolean
}

export interface UpdateUserDto {
  nome?: string
  email?: string
  senha?: string
  perfil?: UserProfile
  usuario_id_pai?: number
  ativo?: boolean
}







