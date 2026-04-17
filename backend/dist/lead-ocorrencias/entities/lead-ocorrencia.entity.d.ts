import { Lead } from '../../leads/entities/lead.entity';
import { Ocorrencia } from '../../ocorrencias/entities/ocorrencia.entity';
import { Produto } from '../../produtos/entities/produto.entity';
import { User } from '../../users/entities/user.entity';
export declare class LeadOcorrencia {
    lead_ocorrencia_id: number;
    leads_id: number;
    lead: Lead;
    ocorrencia_id: number;
    ocorrencia: Ocorrencia;
    produto_id: number;
    produto: Produto;
    data: Date;
    active: boolean;
    created_at: Date;
    created_at_usuarios_id: number;
    created_at_usuario: User;
    deleted_at_usuarios_id: number;
    deleted_at_usuario: User;
}
