import { User } from '../../users/entities/user.entity';
import { KanbanStatus } from '../../kanban-modelos/entities/kanban-status.entity';
export declare enum LeadStatus {
    NAO_ATENDEU = "NAO_ATENDEU",
    NAO_E_MOMENTO = "NAO_E_MOMENTO",
    TEM_INTERESSE = "TEM_INTERESSE",
    NAO_TEM_INTERESSE = "NAO_TEM_INTERESSE",
    TELEFONE_INVALIDO = "TELEFONE_INVALIDO",
    LEAD_QUENTE = "LEAD_QUENTE",
    RETORNO_AGENDADO = "RETORNO_AGENDADO",
    NAO_E_PECUARISTA = "NAO_E_PECUARISTA",
    AGUARDANDO_OFERTAS = "AGUARDANDO_OFERTAS"
}
export declare enum ItemInteresse {
    GIR = "GIR",
    GUZERA = "GUZERA",
    INDUBRASIL = "INDUBRASIL",
    SINDI = "SINDI",
    NELORE = "NELORE",
    NELORE_MOCHO = "NELORE_MOCHO",
    TABAPUA = "TABAPUA",
    BRAHMAN = "BRAHMAN",
    ANGUS = "ANGUS",
    GIROLANDO = "GIROLANDO",
    NELORE_PINTADO = "NELORE_PINTADO",
    HOLANDES = "HOLANDES",
    BRANGUS = "BRANGUS"
}
export declare enum OrigemLead {
    CAMPANHA_MKT = "CAMPANHA_MKT",
    HABILITADOS = "HABILITADOS",
    BASE_RD = "BASE_RD",
    NETWORKING = "NETWORKING",
    WHATSAPP = "WHATSAPP",
    AGENTE_VENDAS = "AGENTE_VENDAS",
    BASE_CANAL_DO_CAMPO = "BASE_CANAL_DO_CAMPO"
}
export declare class Lead {
    id: number;
    data_entrada: Date;
    nome_razao_social: string;
    nome_fantasia_apelido: string;
    telefone: string;
    email: string;
    lead_msg_interesse: string;
    lgpd_aceite: boolean;
    lgpd_data_aceite: Date;
    lgpd_ip_origem: string;
    lgpd_versao_texto: string;
    uf: string;
    municipio: string;
    anotacoes: string;
    origem_lead: string;
    vendedor_id: number;
    vendedor: User;
    usuario_id_colaborador: number;
    colaborador: User;
    kanban_status_id: number;
    kanbanStatus: KanbanStatus;
    total_conversoes: number;
    tipo_lead: string[];
    created_at: Date;
    updated_at: Date;
    ensureTimestampsOnInsert(): void;
    ensureUpdatedAtOnUpdate(): void;
}
