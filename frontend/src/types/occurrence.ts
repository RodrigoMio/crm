export enum OccurrenceType {
  SISTEMA = 'SISTEMA',
  USUARIO = 'USUARIO',
}

export interface Occurrence {
  id: number
  leads_id: number
  usuarios_id: number
  texto: string
  tipo: OccurrenceType
  created_at: string
  usuario?: {
    id: number
    nome: string
    email: string
  }
}

export interface CreateOccurrenceDto {
  texto: string
  tipo?: OccurrenceType
}









