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
  id: string
  data_entrada: string
  nome_razao_social: string
  nome_fantasia_apelido?: string
  telefone?: string
  email?: string
  uf: string
  municipio: string
  anotacoes?: string
  status?: LeadStatus[]
  itens_interesse?: ItemInteresse[]
  origem_lead?: OrigemLead
  vendedor_id: string
  vendedor?: {
    id: string
    nome: string
    email: string
  }
  created_at: string
  updated_at: string
}

export interface CreateLeadDto {
  data_entrada?: string
  nome_razao_social: string
  nome_fantasia_apelido?: string
  telefone?: string
  email?: string
  uf: string
  municipio: string
  anotacoes?: string
  status?: LeadStatus[]
  itens_interesse?: ItemInteresse[]
  origem_lead?: OrigemLead
  vendedor_id: string
}

export interface FilterLeadsDto {
  nome_razao_social?: string
  status?: LeadStatus
  uf?: string
  vendedor_id?: string
}




