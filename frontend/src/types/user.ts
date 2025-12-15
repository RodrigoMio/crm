export enum UserProfile {
  ADMIN = 'ADMIN',
  AGENTE = 'AGENTE',
}

export interface User {
  id: string
  nome: string
  email: string
  perfil: UserProfile
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface CreateUserDto {
  nome: string
  email: string
  senha: string
  perfil: UserProfile
  ativo?: boolean
}

export interface UpdateUserDto {
  nome?: string
  email?: string
  senha?: string
  perfil?: UserProfile
  ativo?: boolean
}





