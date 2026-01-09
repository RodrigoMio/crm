import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Produto } from './entities/produto.entity';
import { CreateProdutoDto } from './dto/create-produto.dto';

@Injectable()
export class ProdutosService {
  constructor(
    @InjectRepository(Produto)
    private produtoRepository: Repository<Produto>,
  ) {}

  /**
   * Normaliza texto removendo acentos, cedilhas e convertendo para minúsculas
   * Ex: "Máqui" -> "maqui", "Fêmea" -> "femea"
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
      .replace(/ç/g, 'c')
      .replace(/ñ/g, 'n');
  }

  /**
   * Busca produtos por descrição (case-insensitive, sem acentos)
   * Se searchTerm estiver vazio, retorna todos os produtos
   * Limita a 10 resultados quando há busca para performance
   * 
   * A busca normaliza acentos: "Máqui" encontra "Maq", "Máq", "Mãq"
   * "Fêmea" encontra "Fem", "Fém", "Fêm", etc
   */
  async search(searchTerm: string): Promise<Produto[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      // Retorna todos os produtos quando não há termo de busca
      return this.produtoRepository.find({
        order: {
          descricao: 'ASC',
        },
      });
    }

    const normalizedSearch = this.normalizeText(searchTerm.trim());

    // Busca todos os produtos e filtra no código (melhor para normalização de acentos)
    // Alternativa: usar translate() do PostgreSQL se houver muitos produtos
    const allProdutos = await this.produtoRepository.find({
      order: {
        descricao: 'ASC',
      },
    });

    // Filtra produtos cuja descrição normalizada contém o termo de busca normalizado
    const produtosFiltrados = allProdutos.filter(produto => {
      const descricaoNormalizada = this.normalizeText(produto.descricao);
      return descricaoNormalizada.includes(normalizedSearch);
    });

    // Limita a 10 resultados
    return produtosFiltrados.slice(0, 10);
  }

  /**
   * Cria um novo produto
   * Verifica se já existe (case-insensitive e sem acentos) antes de criar
   * Ex: "Máqui" e "Maqui" são considerados iguais
   */
  async create(createProdutoDto: CreateProdutoDto): Promise<Produto> {
    const descricaoNormalizada = createProdutoDto.descricao.trim();

    if (descricaoNormalizada.length === 0) {
      throw new BadRequestException('Descrição do produto não pode estar vazia');
    }

    // Busca todos os produtos e verifica se já existe um com descrição normalizada igual
    const allProdutos = await this.produtoRepository.find();
    const descricaoBuscaNormalizada = this.normalizeText(descricaoNormalizada);
    
    const existing = allProdutos.find(produto => 
      this.normalizeText(produto.descricao) === descricaoBuscaNormalizada
    );

    if (existing) {
      return existing;
    }

    // Cria novo produto
    const produto = this.produtoRepository.create({
      descricao: descricaoNormalizada,
    });

    return this.produtoRepository.save(produto);
  }

  /**
   * Busca todos os produtos (para uso interno)
   */
  async findAll(): Promise<Produto[]> {
    return this.produtoRepository.find({
      order: {
        descricao: 'ASC',
      },
    });
  }
}

