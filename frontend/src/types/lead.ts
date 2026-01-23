import { Produto } from './produto'

export enum LeadStatus {
  NAO_ATENDEU = 'NAO_ATENDEU',
  NAO_E_MOMENTO = 'NAO_E_MOMENTO',
  TEM_INTERESSE = 'TEM_INTERESSE',
  NAO_TEM_INTERESSE = 'NAO_TEM_INTERESSE',
  TELEFONE_INVALIDO = 'TELEFONE_INVALIDO',
  LEAD_QUENTE = 'LEAD_QUENTE',
  RETORNO_AGENDADO = 'RETORNO_AGENDADO',
  NAO_E_PECUARISTA = 'NAO_E_PECUARISTA',
  AGUARDANDO_OFERTAS = 'AGUARDANDO_OFERTAS',
}

export enum ItemInteresse {
  GIR = 'GIR',
  GUZERA = 'GUZERA',
  INDUBRASIL = 'INDUBRASIL',
  SINDI = 'SINDI',
  NELORE = 'NELORE',
  NELORE_MOCHO = 'NELORE_MOCHO',
  TABAPUA = 'TABAPUA',
  BRAHMAN = 'BRAHMAN',
  ANGUS = 'ANGUS',
  GIROLANDO = 'GIROLANDO',
  NELORE_PINTADO = 'NELORE_PINTADO',
  HOLANDES = 'HOLANDES',
  BRANGUS = 'BRANGUS',
}

export enum OrigemLead {
  CAMPANHA_MKT = 'CAMPANHA_MKT',
  HABILITADOS = 'HABILITADOS',
  BASE_RD = 'BASE_RD',
  NETWORKING = 'NETWORKING',
  WHATSAPP = 'WHATSAPP',
  AGENTE_VENDAS = 'AGENTE_VENDAS',
  BASE_CANAL_DO_CAMPO = 'BASE_CANAL_DO_CAMPO',
}

export interface Lead {
  id: number
  data_entrada: string
  nome_razao_social: string
  nome_fantasia_apelido?: string
  telefone?: string
  email?: string
  uf?: string
  municipio?: string
  anotacoes?: string
  origem_lead?: OrigemLead
  vendedor_id: string
  vendedor?: {
    id: string
    nome: string
    email: string
  }
  usuario_id_colaborador?: number
  colaborador?: {
    id: number
    nome: string
    email: string
  }
  kanban_status_id?: number
  kanbanStatus?: {
    kanban_status_id: number
    descricao: string
    bg_color: string
    text_color: string
  }
  total_conversoes?: number
  tipo_lead?: string[]
  produtos?: Produto[]
  created_at: string
  updated_at: string
}

export interface CreateLeadDto {
  data_entrada?: string
  nome_razao_social: string
  nome_fantasia_apelido?: string
  telefone?: string
  email?: string
  uf?: string
  municipio?: string
  anotacoes?: string
  origem_lead?: OrigemLead
  vendedor_id?: string
  usuario_id_colaborador?: number
  tipo_lead?: string[]
  produtos?: number[]
}

export interface FilterLeadsDto {
  nome_razao_social?: string
  email?: string
  telefone?: string
  uf?: string
  vendedor_id?: string
  usuario_id_colaborador?: number
  origem_lead?: OrigemLead
  produtos?: number[]
  tipo_lead?: string
}




