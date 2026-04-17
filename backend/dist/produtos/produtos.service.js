"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProdutosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const produto_entity_1 = require("./entities/produto.entity");
const produto_tipo_entity_1 = require("./entities/produto-tipo.entity");
let ProdutosService = class ProdutosService {
    constructor(produtoRepository, produtoTipoRepository) {
        this.produtoRepository = produtoRepository;
        this.produtoTipoRepository = produtoTipoRepository;
    }
    normalizeText(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/ç/g, 'c')
            .replace(/ñ/g, 'n');
    }
    async search(searchTerm) {
        if (!searchTerm || searchTerm.trim().length === 0) {
            return this.produtoRepository.find({
                order: {
                    descricao: 'ASC',
                },
            });
        }
        const normalizedSearch = this.normalizeText(searchTerm.trim());
        const allProdutos = await this.produtoRepository.find({
            order: {
                descricao: 'ASC',
            },
        });
        const produtosFiltrados = allProdutos.filter(produto => {
            const descricaoNormalizada = this.normalizeText(produto.descricao);
            return descricaoNormalizada.includes(normalizedSearch);
        });
        return produtosFiltrados.slice(0, 10);
    }
    async create(createProdutoDto) {
        const descricaoNormalizada = createProdutoDto.descricao.trim();
        if (descricaoNormalizada.length === 0) {
            throw new common_1.BadRequestException('Descrição do produto não pode estar vazia');
        }
        const allProdutos = await this.produtoRepository.find();
        const descricaoBuscaNormalizada = this.normalizeText(descricaoNormalizada);
        const existing = allProdutos.find(produto => this.normalizeText(produto.descricao) === descricaoBuscaNormalizada);
        if (existing) {
            return existing;
        }
        const produtoTipoId = createProdutoDto.produto_tipo_id || 1;
        const produtoTipo = await this.produtoTipoRepository.findOne({
            where: { produto_tipo_id: produtoTipoId },
        });
        if (!produtoTipo) {
            throw new common_1.BadRequestException(`Tipo de produto com ID ${produtoTipoId} não encontrado`);
        }
        const produto = this.produtoRepository.create({
            descricao: descricaoNormalizada,
            produto_tipo_id: produtoTipoId,
        });
        return this.produtoRepository.save(produto);
    }
    async findAll() {
        return this.produtoRepository.find({
            order: {
                descricao: 'ASC',
            },
        });
    }
    async findAllTipos() {
        return this.produtoTipoRepository.find({
            order: {
                descricao: 'ASC',
            },
        });
    }
};
exports.ProdutosService = ProdutosService;
exports.ProdutosService = ProdutosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(produto_entity_1.Produto)),
    __param(1, (0, typeorm_1.InjectRepository)(produto_tipo_entity_1.ProdutoTipo)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ProdutosService);
//# sourceMappingURL=produtos.service.js.map