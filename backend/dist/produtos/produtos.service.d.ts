import { Repository } from 'typeorm';
import { Produto } from './entities/produto.entity';
import { ProdutoTipo } from './entities/produto-tipo.entity';
import { CreateProdutoDto } from './dto/create-produto.dto';
export declare class ProdutosService {
    private produtoRepository;
    private produtoTipoRepository;
    constructor(produtoRepository: Repository<Produto>, produtoTipoRepository: Repository<ProdutoTipo>);
    private normalizeText;
    search(searchTerm: string): Promise<Produto[]>;
    create(createProdutoDto: CreateProdutoDto): Promise<Produto>;
    findAll(): Promise<Produto[]>;
    findAllTipos(): Promise<ProdutoTipo[]>;
}
