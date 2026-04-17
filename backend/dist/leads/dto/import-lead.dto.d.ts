import { OrigemLead } from '../entities/lead.entity';
export declare class ImportLeadDto {
    id?: string;
    data_entrada?: string;
    nome_razao_social: string;
    nome_fantasia_apelido?: string;
    telefone?: string;
    email?: string;
    uf?: string;
    municipio?: string;
    anotacoes?: string;
    origem_lead?: OrigemLead;
    vendedor_id?: number;
    ocorrencia?: string;
    tags?: string;
    total_conversoes?: number;
}
