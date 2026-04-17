import { ProdutoTipo } from './produto-tipo.entity';
export declare class Produto {
    produto_id: number;
    descricao: string;
    produto_tipo_id: number;
    produto_tipo: ProdutoTipo;
}
