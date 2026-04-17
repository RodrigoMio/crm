import { ProdutosService } from './produtos.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
export declare class ProdutosController {
    private readonly produtosService;
    constructor(produtosService: ProdutosService);
    getTipos(): Promise<import("./entities/produto-tipo.entity").ProdutoTipo[]>;
    search(search: string): Promise<import("./entities/produto.entity").Produto[]>;
    create(createProdutoDto: CreateProdutoDto): Promise<import("./entities/produto.entity").Produto>;
}
