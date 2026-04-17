import { Lead } from '../../leads/entities/lead.entity';
import { Produto } from '../../produtos/entities/produto.entity';
export declare class LeadsProduto {
    leads_produto_id: number;
    leads_id: number;
    lead: Lead;
    produto_id: number;
    produto: Produto;
    insert_by_lead: boolean;
}
