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
exports.LeadsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const lead_entity_1 = require("./entities/lead.entity");
const user_entity_1 = require("../users/entities/user.entity");
const produto_entity_1 = require("../produtos/entities/produto.entity");
const ocorrencia_entity_1 = require("../ocorrencias/entities/ocorrencia.entity");
const lead_ocorrencia_entity_1 = require("../lead-ocorrencias/entities/lead-ocorrencia.entity");
const leads_produto_entity_1 = require("../leads-produtos/entities/leads-produto.entity");
const pg_unaccent_search_1 = require("../database/pg-unaccent-search");
let LeadsService = class LeadsService {
    constructor(leadsRepository, usersRepository, produtoRepository, ocorrenciaRepository, leadOcorrenciaRepository, leadsProdutoRepository, dataSource) {
        this.leadsRepository = leadsRepository;
        this.usersRepository = usersRepository;
        this.produtoRepository = produtoRepository;
        this.ocorrenciaRepository = ocorrenciaRepository;
        this.leadOcorrenciaRepository = leadOcorrenciaRepository;
        this.leadsProdutoRepository = leadsProdutoRepository;
        this.dataSource = dataSource;
    }
    normalizeId(id) {
        if (typeof id === 'string') {
            return parseInt(id, 10);
        }
        return Number(id);
    }
    accentInsensitiveKey(text) {
        return (text || '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/ç/g, 'c')
            .replace(/ñ/g, 'n');
    }
    async create(createLeadDto, currentUser) {
        if (currentUser.perfil === user_entity_1.UserProfile.COLABORADOR) {
            throw new common_1.ForbiddenException('Colaborador não pode criar leads');
        }
        if (createLeadDto.vendedor_id) {
            const vendedor = await this.usersRepository.findOne({
                where: { id: createLeadDto.vendedor_id },
            });
            if (!vendedor) {
                throw new common_1.NotFoundException('Vendedor não encontrado');
            }
            if (vendedor.perfil !== user_entity_1.UserProfile.AGENTE) {
                throw new common_1.ForbiddenException('Vendedor deve ser um Agente');
            }
            if (currentUser.perfil === user_entity_1.UserProfile.AGENTE) {
                const currentUserId = this.normalizeId(currentUser.id);
                const vendedorId = this.normalizeId(createLeadDto.vendedor_id);
                if (vendedorId !== currentUserId) {
                    throw new common_1.ForbiddenException('Agente só pode criar leads para si mesmo');
                }
            }
        }
        if (createLeadDto.usuario_id_colaborador) {
            const colaborador = await this.usersRepository.findOne({
                where: { id: createLeadDto.usuario_id_colaborador },
            });
            if (!colaborador) {
                throw new common_1.NotFoundException('Colaborador não encontrado');
            }
            if (colaborador.perfil !== user_entity_1.UserProfile.COLABORADOR) {
                throw new common_1.ForbiddenException('usuario_id_colaborador deve ser um Colaborador');
            }
            if (currentUser.perfil === user_entity_1.UserProfile.AGENTE) {
                const currentUserId = this.normalizeId(currentUser.id);
                const colaboradorPaiId = colaborador.usuario_id_pai ? this.normalizeId(colaborador.usuario_id_pai) : null;
                if (colaboradorPaiId !== currentUserId) {
                    throw new common_1.ForbiddenException('Agente só pode atribuir leads a seus próprios colaboradores');
                }
            }
        }
        const { produtos, ...leadData } = createLeadDto;
        const lead = this.leadsRepository.create({
            ...leadData,
            data_entrada: createLeadDto.data_entrada || new Date(),
        });
        const savedLead = await this.leadsRepository.save(lead);
        if (produtos && produtos.length > 0) {
            await this.syncProdutos(savedLead.id, produtos);
        }
        return this.findOne(savedLead.id, currentUser);
    }
    async getMaxId() {
        const result = await this.leadsRepository
            .createQueryBuilder('lead')
            .select('MAX(lead.id)', 'maxId')
            .getRawOne();
        return result?.maxId ? parseInt(result.maxId, 10) : null;
    }
    async findAvailableOrigens(currentUser) {
        const queryBuilder = this.leadsRepository
            .createQueryBuilder('lead')
            .select('DISTINCT lead.origem_lead', 'origem_lead')
            .where('lead.origem_lead IS NOT NULL')
            .andWhere(`TRIM(lead.origem_lead) <> ''`);
        const userPerfil = String(currentUser.perfil).toUpperCase();
        if (userPerfil === user_entity_1.UserProfile.AGENTE) {
            const userId = this.normalizeId(currentUser.id);
            const colaboradoresDoAgente = await this.usersRepository.find({
                where: {
                    usuario_id_pai: userId,
                    perfil: user_entity_1.UserProfile.COLABORADOR,
                },
                select: ['id'],
            });
            const idsColaboradores = colaboradoresDoAgente.map((c) => this.normalizeId(c.id));
            if (idsColaboradores.length > 0) {
                queryBuilder.andWhere('(lead.vendedor_id = :userId OR lead.usuario_id_colaborador IN (:...colaboradorIds))', { userId, colaboradorIds: idsColaboradores });
            }
            else {
                queryBuilder.andWhere('lead.vendedor_id = :userId', { userId });
            }
        }
        else if (userPerfil === user_entity_1.UserProfile.COLABORADOR) {
            const userId = this.normalizeId(currentUser.id);
            queryBuilder.andWhere('lead.usuario_id_colaborador = :userId', { userId });
        }
        else if (userPerfil !== user_entity_1.UserProfile.ADMIN) {
            queryBuilder.andWhere('1 = 0');
        }
        const rows = await queryBuilder.orderBy('lead.origem_lead', 'ASC').getRawMany();
        return rows
            .map((row) => String(row.origem_lead || '').trim())
            .filter(Boolean);
    }
    async findAll(filterDto, currentUser) {
        const page = filterDto.page || 1;
        const limit = filterDto.limit || 100;
        const skip = (page - 1) * limit;
        const queryBuilder = this.leadsRepository
            .createQueryBuilder('lead')
            .leftJoinAndSelect('lead.vendedor', 'vendedor')
            .leftJoinAndSelect('lead.colaborador', 'colaborador')
            .leftJoinAndSelect('lead.kanbanStatus', 'kanbanStatus');
        const userPerfil = String(currentUser.perfil).toUpperCase();
        console.log('[LeadsService] Perfil do usuário:', currentUser.perfil, 'Normalizado:', userPerfil);
        console.log('[LeadsService] UserProfile.COLABORADOR:', user_entity_1.UserProfile.COLABORADOR);
        if (userPerfil === user_entity_1.UserProfile.AGENTE) {
            const userId = typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id;
            const colaboradoresDoAgente = await this.usersRepository.find({
                where: {
                    usuario_id_pai: userId,
                    perfil: user_entity_1.UserProfile.COLABORADOR
                },
                select: ['id'],
            });
            const idsColaboradores = colaboradoresDoAgente.map(c => this.normalizeId(c.id));
            if (idsColaboradores.length > 0) {
                queryBuilder.where('(lead.vendedor_id = :userId OR lead.usuario_id_colaborador IN (:...colaboradorIds))', {
                    userId,
                    colaboradorIds: idsColaboradores
                });
            }
            else {
                queryBuilder.where('lead.vendedor_id = :userId', { userId });
            }
        }
        else if (userPerfil === user_entity_1.UserProfile.COLABORADOR) {
            const userId = typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id;
            console.log('[LeadsService] Colaborador - userId:', userId, 'tipo:', typeof userId);
            queryBuilder.where('lead.usuario_id_colaborador = :userId', { userId });
        }
        else if (userPerfil !== user_entity_1.UserProfile.ADMIN) {
            console.log('[LeadsService] Perfil desconhecido:', userPerfil);
            queryBuilder.where('1 = 0');
        }
        if (filterDto.nome_razao_social) {
            queryBuilder.andWhere((0, pg_unaccent_search_1.pgWhereUnaccentContains)('COALESCE(lead.nome_razao_social, \'\')', 'nome'), {
                nome: `%${filterDto.nome_razao_social.trim()}%`,
            });
        }
        if (filterDto.email) {
            queryBuilder.andWhere((0, pg_unaccent_search_1.pgWhereUnaccentContains)('COALESCE(lead.email, \'\')', 'email'), {
                email: `%${filterDto.email.trim()}%`,
            });
        }
        if (filterDto.telefone) {
            const telefoneNumeros = filterDto.telefone.trim().replace(/\D/g, '');
            if (telefoneNumeros) {
                queryBuilder.andWhere(`REGEXP_REPLACE(lead.telefone, '[^0-9]', '', 'g') ILIKE :telefone`, { telefone: `%${telefoneNumeros}%` });
            }
        }
        if (filterDto.uf) {
            const ufs = Array.isArray(filterDto.uf) ? filterDto.uf : [filterDto.uf];
            if (ufs.length > 0) {
                queryBuilder.andWhere('lead.uf IN (:...ufs)', { ufs });
            }
        }
        if (filterDto.vendedor_id) {
            if (currentUser.perfil === user_entity_1.UserProfile.AGENTE) {
                const currentUserId = this.normalizeId(currentUser.id);
                const vendedorId = this.normalizeId(filterDto.vendedor_id);
                if (vendedorId !== currentUserId) {
                    throw new common_1.ForbiddenException('Agente não pode filtrar por outro vendedor');
                }
            }
            const vendedorId = this.normalizeId(filterDto.vendedor_id);
            queryBuilder.andWhere('lead.vendedor_id = :vendedorId', { vendedorId });
        }
        if (filterDto.usuario_id_colaborador) {
            if (currentUser.perfil === user_entity_1.UserProfile.AGENTE) {
                const colaborador = await this.usersRepository.findOne({
                    where: { id: filterDto.usuario_id_colaborador },
                });
                const currentUserId = this.normalizeId(currentUser.id);
                const colaboradorPaiId = colaborador.usuario_id_pai ? this.normalizeId(colaborador.usuario_id_pai) : null;
                if (!colaborador || colaboradorPaiId !== currentUserId) {
                    throw new common_1.ForbiddenException('Agente só pode filtrar por seus próprios colaboradores');
                }
            }
            if (currentUser.perfil === user_entity_1.UserProfile.COLABORADOR) {
                const currentUserId = this.normalizeId(currentUser.id);
                const colaboradorId = this.normalizeId(filterDto.usuario_id_colaborador);
                if (colaboradorId !== currentUserId) {
                    throw new common_1.ForbiddenException('Colaborador só pode ver seus próprios leads');
                }
            }
            const colaboradorId = this.normalizeId(filterDto.usuario_id_colaborador);
            queryBuilder.andWhere('lead.usuario_id_colaborador = :colaboradorId', {
                colaboradorId
            });
        }
        if (filterDto.origem_lead) {
            queryBuilder.andWhere('lead.origem_lead = :origemLead', { origemLead: filterDto.origem_lead });
        }
        if (filterDto.produtos && filterDto.produtos.length > 0) {
            queryBuilder.andWhere(`EXISTS (SELECT 1 FROM leads_produto WHERE leads_produto.leads_id = lead.id AND leads_produto.produto_id IN (:...produtoIds))`, {
                produtoIds: filterDto.produtos,
            });
        }
        if (filterDto.tipo_lead) {
            queryBuilder.andWhere(':tipoLead = ANY(lead.tipo_lead)', { tipoLead: filterDto.tipo_lead });
        }
        queryBuilder.orderBy('lead.created_at', 'DESC');
        const total = await queryBuilder.getCount();
        queryBuilder.skip(skip).take(limit);
        try {
            console.log('[LeadsService] Buscando leads para usuário:', {
                id: currentUser.id,
                perfil: currentUser.perfil,
                userPerfil,
                tipoId: typeof currentUser.id,
            });
            const sql = queryBuilder.getSql();
            const params = queryBuilder.getParameters();
            console.log('[LeadsService] Query SQL:', sql);
            console.log('[LeadsService] Parâmetros:', params);
            const data = await queryBuilder.getMany();
            console.log('[LeadsService] Leads encontrados:', data.length);
            for (const lead of data) {
                if (lead.usuario_id_colaborador && !lead.colaborador) {
                    try {
                        const colaborador = await this.usersRepository.findOne({
                            where: { id: lead.usuario_id_colaborador },
                            select: ['id', 'nome', 'email'],
                        });
                        if (colaborador) {
                            lead.colaborador = colaborador;
                        }
                    }
                    catch (err) {
                        console.warn('[LeadsService] Erro ao buscar colaborador:', err);
                    }
                }
            }
            return {
                data,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        }
        catch (error) {
            console.error('[LeadsService] Erro ao buscar leads:', error);
            console.error('[LeadsService] Query SQL:', queryBuilder.getSql());
            console.error('[LeadsService] Parâmetros:', queryBuilder.getParameters());
            console.error('[LeadsService] Stack:', error.stack);
            throw new common_1.BadRequestException(`Erro ao buscar leads: ${error.message}`);
        }
    }
    async findOne(id, currentUser) {
        const lead = await this.leadsRepository.findOne({
            where: { id },
            relations: ['vendedor', 'colaborador'],
        });
        if (!lead) {
            throw new common_1.NotFoundException('Lead não encontrado');
        }
        const currentUserId = this.normalizeId(currentUser.id);
        const leadVendedorId = this.normalizeId(lead.vendedor_id);
        if (currentUser.perfil === user_entity_1.UserProfile.AGENTE) {
            if (leadVendedorId !== currentUserId) {
                if (lead.usuario_id_colaborador) {
                    const colaborador = await this.usersRepository.findOne({
                        where: { id: lead.usuario_id_colaborador },
                    });
                    const colaboradorPaiId = colaborador?.usuario_id_pai ? this.normalizeId(colaborador.usuario_id_pai) : null;
                    if (!colaborador || colaboradorPaiId !== currentUserId) {
                        throw new common_1.ForbiddenException('Você não tem permissão para ver este lead');
                    }
                }
                else {
                    throw new common_1.ForbiddenException('Você não tem permissão para ver este lead');
                }
            }
        }
        else if (currentUser.perfil === user_entity_1.UserProfile.COLABORADOR) {
            const leadColaboradorId = lead.usuario_id_colaborador ? this.normalizeId(lead.usuario_id_colaborador) : null;
            if (leadColaboradorId !== currentUserId) {
                const lksRows = await this.dataSource.query(`SELECT 1 FROM lead_kanban_status WHERE lead_id = $1 AND usuario_id_colaborador = $2 LIMIT 1`, [id, currentUserId]);
                if (!lksRows?.length) {
                    throw new common_1.ForbiddenException('Você não tem permissão para ver este lead');
                }
            }
        }
        const leadsProdutos = await this.leadsProdutoRepository.find({
            where: { leads_id: id },
            relations: ['produto', 'produto.produto_tipo'],
        });
        lead.produtos = leadsProdutos.map(lp => ({
            ...lp.produto,
            insert_by_lead: !!lp.insert_by_lead,
        }));
        return lead;
    }
    async update(id, updateLeadDto, currentUser) {
        const lead = await this.findOne(id, currentUser);
        if (currentUser.perfil === user_entity_1.UserProfile.COLABORADOR) {
            throw new common_1.ForbiddenException('Colaborador não pode editar leads');
        }
        if (updateLeadDto.vendedor_id !== undefined) {
            if (updateLeadDto.vendedor_id === null) {
                lead.vendedor_id = null;
            }
            else {
                const leadVendedorId = lead.vendedor_id ? this.normalizeId(lead.vendedor_id) : null;
                const updateVendedorId = this.normalizeId(updateLeadDto.vendedor_id);
                if (updateVendedorId !== leadVendedorId) {
                    if (currentUser.perfil === user_entity_1.UserProfile.AGENTE) {
                        throw new common_1.ForbiddenException('Agente não pode alterar vendedor_id');
                    }
                    const vendedor = await this.usersRepository.findOne({
                        where: { id: updateVendedorId },
                    });
                    if (!vendedor) {
                        throw new common_1.NotFoundException('Vendedor não encontrado');
                    }
                    if (vendedor.perfil !== user_entity_1.UserProfile.AGENTE) {
                        throw new common_1.ForbiddenException('Vendedor deve ser um Agente');
                    }
                    lead.vendedor_id = updateVendedorId;
                }
            }
        }
        if (updateLeadDto.usuario_id_colaborador !== undefined) {
            if (updateLeadDto.usuario_id_colaborador === null) {
                lead.usuario_id_colaborador = null;
            }
            else {
                const colaborador = await this.usersRepository.findOne({
                    where: { id: updateLeadDto.usuario_id_colaborador },
                });
                if (!colaborador) {
                    throw new common_1.NotFoundException('Colaborador não encontrado');
                }
                if (colaborador.perfil !== user_entity_1.UserProfile.COLABORADOR) {
                    throw new common_1.ForbiddenException('usuario_id_colaborador deve ser um Colaborador');
                }
                if (currentUser.perfil === user_entity_1.UserProfile.AGENTE) {
                    const currentUserId = this.normalizeId(currentUser.id);
                    const colaboradorPaiId = colaborador.usuario_id_pai ? this.normalizeId(colaborador.usuario_id_pai) : null;
                    if (colaboradorPaiId !== currentUserId) {
                        throw new common_1.ForbiddenException('Agente só pode atribuir leads a seus próprios colaboradores');
                    }
                }
                lead.usuario_id_colaborador = updateLeadDto.usuario_id_colaborador;
            }
        }
        const { produtos, ...updateData } = updateLeadDto;
        if (currentUser.perfil === user_entity_1.UserProfile.ADMIN) {
            Object.assign(lead, updateData);
        }
        else {
            const { vendedor_id, ...dataWithoutVendedor } = updateData;
            Object.assign(lead, dataWithoutVendedor);
        }
        const savedLead = await this.leadsRepository.save(lead);
        if (produtos !== undefined) {
            await this.syncProdutos(savedLead.id, produtos);
        }
        return this.findOne(savedLead.id, currentUser);
    }
    async remove(id, currentUser) {
        const lead = await this.findOne(id, currentUser);
        if (currentUser.perfil === user_entity_1.UserProfile.COLABORADOR) {
            throw new common_1.ForbiddenException('Colaborador não pode remover leads');
        }
        if (currentUser.perfil === user_entity_1.UserProfile.AGENTE) {
            const currentUserId = this.normalizeId(currentUser.id);
            const leadVendedorId = this.normalizeId(lead.vendedor_id);
            if (leadVendedorId !== currentUserId) {
                throw new common_1.ForbiddenException('Agente só pode remover seus próprios leads');
            }
        }
        await this.leadsRepository.remove(lead);
    }
    async checkKanbanStatus(id, tipoFluxo, currentUser) {
        await this.findOne(id, currentUser);
        if (tipoFluxo !== 'COMPRADOR' && tipoFluxo !== 'VENDEDOR') {
            throw new common_1.BadRequestException('tipoFluxo deve ser COMPRADOR ou VENDEDOR');
        }
        const result = await this.dataSource.query(`SELECT COUNT(*) as count FROM lead_kanban_status 
       WHERE lead_id = $1 AND tipo_fluxo = $2`, [id, tipoFluxo]);
        const hasStatus = parseInt(result[0]?.count || '0', 10) > 0;
        return { hasStatus };
    }
    async findOrCreateProduto(manager, descricao) {
        const descricaoNormalizada = descricao.trim();
        const produto = await manager
            .createQueryBuilder(produto_entity_1.Produto, 'produto')
            .where((0, pg_unaccent_search_1.pgWhereUnaccentEquals)('produto.descricao', 'descricao'), { descricao: descricaoNormalizada })
            .getOne();
        if (produto) {
            return produto;
        }
        const novoProduto = manager.create(produto_entity_1.Produto, {
            descricao: descricaoNormalizada,
        });
        return await manager.save(produto_entity_1.Produto, novoProduto);
    }
    async findOrCreateOcorrencia(manager, descricao) {
        const descricaoNormalizada = descricao.trim();
        const ocorrencia = await manager
            .createQueryBuilder(ocorrencia_entity_1.Ocorrencia, 'ocorrencia')
            .where((0, pg_unaccent_search_1.pgWhereUnaccentEquals)('ocorrencia.descricao', 'descricao'), { descricao: descricaoNormalizada })
            .getOne();
        if (ocorrencia) {
            return ocorrencia;
        }
        const novaOcorrencia = manager.create(ocorrencia_entity_1.Ocorrencia, {
            descricao: descricaoNormalizada,
        });
        return await manager.save(ocorrencia_entity_1.Ocorrencia, novaOcorrencia);
    }
    async findOrCreateLeadsProduto(manager, leadId, produtoId) {
        const existing = await manager.findOne(leads_produto_entity_1.LeadsProduto, {
            where: { leads_id: leadId, produto_id: produtoId },
        });
        if (existing) {
            return existing;
        }
        const novo = manager.create(leads_produto_entity_1.LeadsProduto, {
            leads_id: leadId,
            produto_id: produtoId,
        });
        return await manager.save(leads_produto_entity_1.LeadsProduto, novo);
    }
    async syncProdutos(leadId, produtoIds) {
        const produtosAtuais = await this.leadsProdutoRepository.find({
            where: { leads_id: leadId },
        });
        const produtosAtuaisIds = produtosAtuais.map(p => p.produto_id);
        const produtosParaRemover = produtosAtuaisIds.filter(id => !produtoIds.includes(id));
        const produtosParaAdicionar = produtoIds.filter(id => !produtosAtuaisIds.includes(id));
        if (produtosParaRemover.length > 0) {
            for (const produtoId of produtosParaRemover) {
                await this.leadsProdutoRepository.delete({
                    leads_id: leadId,
                    produto_id: produtoId,
                });
            }
        }
        if (produtosParaAdicionar.length > 0) {
            const produtosExistentes = await this.produtoRepository.find({
                where: produtosParaAdicionar.map(id => ({ produto_id: id })),
            });
            const produtosExistentesIds = produtosExistentes.map(p => p.produto_id);
            const produtosInvalidos = produtosParaAdicionar.filter(id => !produtosExistentesIds.includes(id));
            if (produtosInvalidos.length > 0) {
                throw new common_1.BadRequestException(`Produtos não encontrados: ${produtosInvalidos.join(', ')}`);
            }
            const novosRelacionamentos = produtosParaAdicionar.map(produtoId => this.leadsProdutoRepository.create({
                leads_id: leadId,
                produto_id: produtoId,
            }));
            await this.leadsProdutoRepository.save(novosRelacionamentos);
        }
    }
    parseOcorrenciaDate(dateString) {
        if (!dateString || !dateString.trim()) {
            return new Date();
        }
        const dateStr = dateString.trim();
        const isoDateRegex = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/;
        const isoMatch = dateStr.match(isoDateRegex);
        if (isoMatch) {
            const year = parseInt(isoMatch[1], 10);
            const month = parseInt(isoMatch[2], 10);
            const day = parseInt(isoMatch[3], 10);
            if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
                const date = new Date(year, month - 1, day);
                if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
                    return date;
                }
            }
        }
        const brazilianDateRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
        const match = dateStr.match(brazilianDateRegex);
        if (match) {
            const day = parseInt(match[1], 10);
            const month = parseInt(match[2], 10);
            const year = parseInt(match[3], 10);
            if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
                const date = new Date(year, month - 1, day);
                if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
                    return date;
                }
            }
        }
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return date;
        }
        return new Date();
    }
    async processOcorrencias(manager, leadId, ocorrenciaString) {
        if (!ocorrenciaString || !ocorrenciaString.trim()) {
            return;
        }
        const ocorrencias = ocorrenciaString.split('|').filter(o => o && o.trim());
        for (const ocorrenciaItem of ocorrencias) {
            if (!ocorrenciaItem.trim())
                continue;
            const parts = ocorrenciaItem.split('#');
            if (parts.length < 2)
                continue;
            const dataString = parts[0].trim();
            const resto = parts[1].trim();
            const restoParts = resto.split(':');
            if (restoParts.length < 2)
                continue;
            const descricaoOcorrencia = restoParts[0].trim();
            const produtosString = restoParts.slice(1).join(':').trim();
            if (!descricaoOcorrencia || !produtosString)
                continue;
            const produtosArray = produtosString.split(',').map(p => p.trim()).filter(p => p);
            const produtoFinal = produtosArray.join(' ');
            if (!produtoFinal)
                continue;
            const ocorrencia = await this.findOrCreateOcorrencia(manager, descricaoOcorrencia);
            const produto = await this.findOrCreateProduto(manager, produtoFinal);
            const data = this.parseOcorrenciaDate(dataString);
            const leadOcorrencia = manager.create(lead_ocorrencia_entity_1.LeadOcorrencia, {
                leads_id: leadId,
                ocorrencia_id: ocorrencia.ocorrencia_id,
                produto_id: produto.produto_id,
                data: data,
                active: true,
            });
            await manager.save(lead_ocorrencia_entity_1.LeadOcorrencia, leadOcorrencia);
            await this.findOrCreateLeadsProduto(manager, leadId, produto.produto_id);
        }
    }
    async processTags(manager, leadId, tagsString) {
        if (!tagsString || !tagsString.trim()) {
            return;
        }
        const tagRegex = /\[([^\]]+)\]/g;
        const matches = tagsString.matchAll(tagRegex);
        const tags = [];
        for (const match of matches) {
            if (match[1] && match[1].trim()) {
                tags.push(match[1].trim());
            }
        }
        if (tags.length === 0) {
            return;
        }
        for (const tag of tags) {
            const produto = await this.findOrCreateProduto(manager, tag);
            await this.findOrCreateLeadsProduto(manager, leadId, produto.produto_id);
        }
    }
    async processOcorrenciasWithCache(manager, leadId, ocorrenciaString, produtosCache, ocorrenciasCache) {
        if (!ocorrenciaString || !ocorrenciaString.trim()) {
            return;
        }
        const ocorrencias = ocorrenciaString.split('|').filter(o => o && o.trim());
        for (const ocorrenciaItem of ocorrencias) {
            if (!ocorrenciaItem.trim())
                continue;
            const parts = ocorrenciaItem.split('#');
            if (parts.length < 2)
                continue;
            const dataString = parts[0].trim();
            const resto = parts[1].trim();
            const restoParts = resto.split(':');
            if (restoParts.length < 2)
                continue;
            const descricaoOcorrencia = restoParts[0].trim();
            const produtosString = restoParts.slice(1).join(':').trim();
            if (!descricaoOcorrencia || !produtosString)
                continue;
            const produtosArray = produtosString.split(',').map(p => p.trim()).filter(p => p);
            const produtoFinal = produtosArray.join(' ');
            if (!produtoFinal)
                continue;
            let ocorrencia = ocorrenciasCache.get(this.accentInsensitiveKey(descricaoOcorrencia));
            if (!ocorrencia) {
                ocorrencia = await this.findOrCreateOcorrencia(manager, descricaoOcorrencia);
                ocorrenciasCache.set(this.accentInsensitiveKey(descricaoOcorrencia), ocorrencia);
            }
            let produto = produtosCache.get(this.accentInsensitiveKey(produtoFinal));
            if (!produto) {
                produto = await this.findOrCreateProduto(manager, produtoFinal);
                produtosCache.set(this.accentInsensitiveKey(produtoFinal), produto);
            }
            const data = this.parseOcorrenciaDate(dataString);
            const leadOcorrencia = manager.create(lead_ocorrencia_entity_1.LeadOcorrencia, {
                leads_id: leadId,
                ocorrencia_id: ocorrencia.ocorrencia_id,
                produto_id: produto.produto_id,
                data: data,
                active: true,
            });
            await manager.save(lead_ocorrencia_entity_1.LeadOcorrencia, leadOcorrencia);
            await this.findOrCreateLeadsProduto(manager, leadId, produto.produto_id);
        }
    }
    async processTagsWithCache(manager, leadId, tagsString, produtosCache) {
        if (!tagsString || !tagsString.trim()) {
            return;
        }
        const tagRegex = /\[([^\]]+)\]/g;
        const matches = tagsString.matchAll(tagRegex);
        const tags = [];
        for (const match of matches) {
            if (match[1] && match[1].trim()) {
                tags.push(match[1].trim());
            }
        }
        if (tags.length === 0) {
            return;
        }
        for (const tag of tags) {
            let produto = produtosCache.get(this.accentInsensitiveKey(tag));
            if (!produto) {
                produto = await this.findOrCreateProduto(manager, tag);
                produtosCache.set(this.accentInsensitiveKey(tag), produto);
            }
            await this.findOrCreateLeadsProduto(manager, leadId, produto.produto_id);
        }
    }
    async importLeads(leadsData, currentUser) {
        let success = 0;
        let idsIgnorados = 0;
        const BATCH_SIZE = 100;
        const allLeadIds = leadsData
            .map((leadData, index) => {
            if (!leadData.id)
                return null;
            const idValue = typeof leadData.id === 'string' ? leadData.id.trim() : String(leadData.id).trim();
            if (idValue === '' || isNaN(Number(idValue)))
                return null;
            return parseInt(idValue, 10);
        })
            .filter((id) => id !== null);
        const existingIds = new Set();
        if (allLeadIds.length > 0) {
            const existingLeads = await this.leadsRepository
                .createQueryBuilder('lead')
                .select('lead.id', 'id')
                .where('lead.id IN (:...ids)', { ids: allLeadIds })
                .getRawMany();
            existingLeads.forEach(lead => existingIds.add(lead.id));
        }
        const idsToInsert = allLeadIds.filter(id => !existingIds.has(id));
        if (idsToInsert.length > 0) {
            const maxImportId = Math.max(...idsToInsert);
            const maxIdResult = await this.leadsRepository.query(`SELECT COALESCE(MAX(id), 0) as max_id FROM leads`);
            const maxId = parseInt(maxIdResult[0]?.max_id || '0', 10);
            if (maxImportId > maxId) {
                await this.leadsRepository.query(`SELECT setval('leads_id_seq', $1, false)`, [maxImportId]);
            }
        }
        const vendedorNomesUnicos = new Set();
        const vendedorIdsUnicos = new Set();
        leadsData.forEach(leadData => {
            const vendedorNome = leadData.vendedor?.trim();
            if (vendedorNome && vendedorNome !== '') {
                vendedorNomesUnicos.add(vendedorNome);
            }
            if (leadData.vendedor_id) {
                vendedorIdsUnicos.add(leadData.vendedor_id);
            }
        });
        const vendedoresCache = new Map();
        const vendedoresByIdCache = new Map();
        if (vendedorNomesUnicos.size > 0) {
            const vendedoresNomes = Array.from(vendedorNomesUnicos);
            const vendedores = await this.usersRepository
                .createQueryBuilder('user')
                .where('user.nome IN (:...nomes)', { nomes: vendedoresNomes })
                .andWhere('user.perfil = :perfil', { perfil: user_entity_1.UserProfile.AGENTE })
                .andWhere('user.ativo = :ativo', { ativo: true })
                .getMany();
            vendedores.forEach(v => {
                vendedoresCache.set(v.nome.toLowerCase(), v);
                vendedoresByIdCache.set(v.id, v);
            });
        }
        if (vendedorIdsUnicos.size > 0) {
            const vendedoresIds = Array.from(vendedorIdsUnicos);
            const vendedoresById = await this.usersRepository
                .createQueryBuilder('user')
                .where('user.id IN (:...ids)', { ids: vendedoresIds })
                .getMany();
            vendedoresById.forEach(v => {
                vendedoresByIdCache.set(v.id, v);
            });
        }
        const produtosUnicos = new Set();
        const ocorrenciasUnicas = new Set();
        leadsData.forEach(leadData => {
            if (leadData.ocorrencia) {
                const ocorrencias = leadData.ocorrencia.split('|').filter(o => o && o.trim());
                ocorrencias.forEach(ocorrenciaItem => {
                    const parts = ocorrenciaItem.split('#');
                    if (parts.length >= 2) {
                        const resto = parts[1].trim();
                        const restoParts = resto.split(':');
                        if (restoParts.length >= 2) {
                            const descricaoOcorrencia = restoParts[0].trim();
                            ocorrenciasUnicas.add(descricaoOcorrencia);
                            const produtosString = restoParts.slice(1).join(':').trim();
                            const produtosArray = produtosString.split(',').map(p => p.trim()).filter(p => p);
                            const produtoFinal = produtosArray.join(' ');
                            if (produtoFinal) {
                                produtosUnicos.add(produtoFinal);
                            }
                        }
                    }
                });
            }
            if (leadData.tags) {
                const tagRegex = /\[([^\]]+)\]/g;
                const matches = leadData.tags.matchAll(tagRegex);
                for (const match of matches) {
                    if (match[1] && match[1].trim()) {
                        produtosUnicos.add(match[1].trim());
                    }
                }
            }
        });
        const produtosCache = new Map();
        const ocorrenciasCache = new Map();
        if (produtosUnicos.size > 0) {
            const produtosExistentes = await this.produtoRepository
                .createQueryBuilder('produto')
                .where((0, pg_unaccent_search_1.pgWhereUnaccentIn)('produto.descricao', 'descricoes'), {
                descricoes: Array.from(produtosUnicos),
            })
                .getMany();
            produtosExistentes.forEach(p => {
                produtosCache.set(this.accentInsensitiveKey(p.descricao), p);
            });
            const produtosParaCriar = Array.from(produtosUnicos).filter(p => !produtosCache.has(this.accentInsensitiveKey(p)));
            if (produtosParaCriar.length > 0) {
                const novosProdutos = produtosParaCriar.map(descricao => this.produtoRepository.create({ descricao: descricao.trim() }));
                const produtosCriados = await this.produtoRepository.save(novosProdutos);
                produtosCriados.forEach(p => {
                    produtosCache.set(this.accentInsensitiveKey(p.descricao), p);
                });
            }
        }
        if (ocorrenciasUnicas.size > 0) {
            const ocorrenciasExistentes = await this.ocorrenciaRepository
                .createQueryBuilder('ocorrencia')
                .where((0, pg_unaccent_search_1.pgWhereUnaccentIn)('ocorrencia.descricao', 'descricoes'), {
                descricoes: Array.from(ocorrenciasUnicas),
            })
                .getMany();
            ocorrenciasExistentes.forEach(o => {
                ocorrenciasCache.set(this.accentInsensitiveKey(o.descricao), o);
            });
            const ocorrenciasParaCriar = Array.from(ocorrenciasUnicas).filter(o => !ocorrenciasCache.has(this.accentInsensitiveKey(o)));
            if (ocorrenciasParaCriar.length > 0) {
                const novasOcorrencias = ocorrenciasParaCriar.map(descricao => this.ocorrenciaRepository.create({ descricao: descricao.trim() }));
                const ocorrenciasCriadas = await this.ocorrenciaRepository.save(novasOcorrencias);
                ocorrenciasCriadas.forEach(o => {
                    ocorrenciasCache.set(this.accentInsensitiveKey(o.descricao), o);
                });
            }
        }
        for (let batchStart = 0; batchStart < leadsData.length; batchStart += BATCH_SIZE) {
            const batchEnd = Math.min(batchStart + BATCH_SIZE, leadsData.length);
            const batch = leadsData.slice(batchStart, batchEnd);
            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
            try {
                for (let batchIndex = 0; batchIndex < batch.length; batchIndex++) {
                    const leadData = batch[batchIndex];
                    const linha = batchStart + batchIndex + 2;
                    let leadId;
                    if (!leadData.id) {
                        await queryRunner.rollbackTransaction();
                        const error = new common_1.BadRequestException({
                            linha,
                            id: '',
                            erro: 'ID não preenchido. Campo ID é obrigatório e deve ser um número.',
                            linhasImportadas: success,
                        });
                        error.success = success;
                        throw error;
                    }
                    const idValue = typeof leadData.id === 'string' ? leadData.id.trim() : String(leadData.id).trim();
                    if (idValue === '' || isNaN(Number(idValue))) {
                        await queryRunner.rollbackTransaction();
                        const error = new common_1.BadRequestException({
                            linha,
                            id: idValue,
                            erro: 'ID deve ser um número válido',
                            linhasImportadas: success,
                        });
                        error.success = success;
                        throw error;
                    }
                    leadId = parseInt(idValue, 10);
                    if (existingIds.has(leadId)) {
                        idsIgnorados++;
                        continue;
                    }
                    let vendedor = null;
                    const vendedorNome = leadData.vendedor?.trim();
                    if (vendedorNome && vendedorNome !== '') {
                        vendedor = vendedoresCache.get(vendedorNome.toLowerCase());
                        if (!vendedor) {
                            await queryRunner.rollbackTransaction();
                            const error = new common_1.BadRequestException({
                                linha,
                                id: String(leadId),
                                erro: `Vendedor "${vendedorNome}" não encontrado`,
                                linhasImportadas: success,
                            });
                            error.success = success;
                            throw error;
                        }
                    }
                    else if (leadData.vendedor_id) {
                        vendedor = vendedoresByIdCache.get(leadData.vendedor_id);
                    }
                    if (currentUser.perfil === user_entity_1.UserProfile.AGENTE) {
                        vendedor = currentUser;
                    }
                    if (vendedor && vendedor.perfil !== user_entity_1.UserProfile.AGENTE) {
                        await queryRunner.rollbackTransaction();
                        const error = new common_1.BadRequestException({
                            linha,
                            id: String(leadId),
                            erro: 'Vendedor deve ser um Agente',
                            linhasImportadas: success,
                        });
                        error.success = success;
                        throw error;
                    }
                    const leadToSave = {
                        id: leadId,
                        nome_razao_social: leadData.nome_razao_social.trim(),
                        vendedor_id: vendedor ? vendedor.id : null,
                        data_entrada: leadData.data_entrada ? new Date(leadData.data_entrada) : new Date(),
                    };
                    if (leadData.telefone)
                        leadToSave.telefone = leadData.telefone.trim();
                    if (leadData.email)
                        leadToSave.email = leadData.email.trim();
                    if (leadData.anotacoes)
                        leadToSave.anotacoes = leadData.anotacoes.trim();
                    if (leadData.nome_fantasia_apelido)
                        leadToSave.nome_fantasia_apelido = leadData.nome_fantasia_apelido.trim();
                    if (leadData.uf && leadData.uf.trim()) {
                        leadToSave.uf = leadData.uf.trim().substring(0, 2).toUpperCase();
                    }
                    if (leadData.municipio && leadData.municipio.trim()) {
                        leadToSave.municipio = leadData.municipio.trim();
                    }
                    if (leadData.origem_lead) {
                        leadToSave.origem_lead = leadData.origem_lead;
                    }
                    if (leadData.total_conversoes !== undefined && leadData.total_conversoes !== null) {
                        const totalConversoesStr = String(leadData.total_conversoes).trim();
                        if (totalConversoesStr !== '') {
                            const totalConversoesNum = Number(totalConversoesStr);
                            if (!isNaN(totalConversoesNum) && isFinite(totalConversoesNum)) {
                                leadToSave.total_conversoes = Math.floor(totalConversoesNum);
                            }
                            else {
                                const parsedInt = parseInt(totalConversoesStr, 10);
                                if (!isNaN(parsedInt)) {
                                    leadToSave.total_conversoes = parsedInt;
                                }
                            }
                        }
                    }
                    const columns = Object.keys(leadToSave).filter(key => leadToSave[key] !== undefined && leadToSave[key] !== null);
                    const values = columns.map(key => {
                        const val = leadToSave[key];
                        if (val instanceof Date) {
                            return val.toISOString().split('T')[0];
                        }
                        return val;
                    });
                    const placeholders = columns.map((_, index) => `$${index + 1}`);
                    const columnsStr = columns.join(', ');
                    const placeholdersStr = placeholders.join(', ');
                    await queryRunner.manager.query(`INSERT INTO leads (${columnsStr}) VALUES (${placeholdersStr})`, values);
                    const savedLeadId = leadId;
                    if (leadData.ocorrencia) {
                        await this.processOcorrenciasWithCache(queryRunner.manager, savedLeadId, leadData.ocorrencia, produtosCache, ocorrenciasCache);
                    }
                    if (leadData.tags) {
                        await this.processTagsWithCache(queryRunner.manager, savedLeadId, leadData.tags, produtosCache);
                    }
                    success++;
                }
                await queryRunner.commitTransaction();
            }
            catch (error) {
                await queryRunner.rollbackTransaction();
                if (error instanceof common_1.BadRequestException) {
                    throw error;
                }
                const erroIndex = batchStart;
                const erroLinha = erroIndex + 2;
                const erroLeadData = leadsData[erroIndex];
                const erroLeadId = erroLeadData?.id ? String(erroLeadData.id) : 'N/A';
                const errorWithSuccess = new common_1.BadRequestException({
                    linha: erroLinha,
                    id: erroLeadId,
                    erro: error.message || 'Erro ao processar lead e suas ocorrências/tags',
                    linhasImportadas: success,
                });
                errorWithSuccess.success = success;
                throw errorWithSuccess;
            }
            finally {
                await queryRunner.release();
            }
        }
        return { success, error: null, idsIgnorados };
    }
};
exports.LeadsService = LeadsService;
exports.LeadsService = LeadsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(lead_entity_1.Lead)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(produto_entity_1.Produto)),
    __param(3, (0, typeorm_1.InjectRepository)(ocorrencia_entity_1.Ocorrencia)),
    __param(4, (0, typeorm_1.InjectRepository)(lead_ocorrencia_entity_1.LeadOcorrencia)),
    __param(5, (0, typeorm_1.InjectRepository)(leads_produto_entity_1.LeadsProduto)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], LeadsService);
//# sourceMappingURL=leads.service.js.map