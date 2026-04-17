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
exports.LandingPagesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const landing_page_entity_1 = require("./entities/landing-page.entity");
const landing_page_produto_entity_1 = require("./entities/landing-page-produto.entity");
const user_entity_1 = require("../users/entities/user.entity");
const lead_entity_1 = require("../leads/entities/lead.entity");
const produto_entity_1 = require("../produtos/entities/produto.entity");
const leads_produto_entity_1 = require("../leads-produtos/entities/leads-produto.entity");
let LandingPagesService = class LandingPagesService {
    constructor(landingPagesRepository, landingPageProdutoRepository, produtosRepository, leadsProdutoRepository, usersRepository, leadsRepository) {
        this.landingPagesRepository = landingPagesRepository;
        this.landingPageProdutoRepository = landingPageProdutoRepository;
        this.produtosRepository = produtosRepository;
        this.leadsProdutoRepository = leadsProdutoRepository;
        this.usersRepository = usersRepository;
        this.leadsRepository = leadsRepository;
    }
    normalizeSlug(slug) {
        return slug
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }
    normalizePhone(telefone) {
        const onlyDigits = (telefone || '').replace(/\D/g, '');
        if (!onlyDigits)
            return '';
        return `+${onlyDigits}`;
    }
    normalizeAuthorizedDomains(value) {
        if (!value)
            return null;
        const domains = value
            .split(';')
            .map((domain) => domain.trim().toLowerCase())
            .map((domain) => domain.replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
            .filter(Boolean);
        if (domains.length === 0)
            return null;
        return domains.join(';');
    }
    extractHostnameFromHeader(originOrReferer) {
        if (!originOrReferer)
            return '';
        try {
            const hostname = new URL(originOrReferer).hostname.toLowerCase();
            return hostname.replace(/^www\./, '');
        }
        catch {
            return '';
        }
    }
    extractIp(reqIp) {
        if (!reqIp)
            return '';
        if (reqIp.startsWith('::ffff:')) {
            return reqIp.replace('::ffff:', '');
        }
        return reqIp;
    }
    isAdmin(user) {
        return String(user.perfil).toUpperCase() === user_entity_1.UserProfile.ADMIN;
    }
    isAgente(user) {
        return String(user.perfil).toUpperCase() === user_entity_1.UserProfile.AGENTE;
    }
    ensureAdminOrAgente(user) {
        if (!this.isAdmin(user) && !this.isAgente(user)) {
            throw new common_1.ForbiddenException('Acesso permitido apenas para Admin ou Agente');
        }
    }
    async validateAssignments(data, currentUser) {
        let vendedorId = data.vendedor_id ?? null;
        const colaboradorId = data.usuario_id_colaborador ?? null;
        if (this.isAgente(currentUser)) {
            vendedorId = Number(currentUser.id);
        }
        if (vendedorId) {
            const vendedor = await this.usersRepository.findOne({ where: { id: vendedorId } });
            if (!vendedor || String(vendedor.perfil).toUpperCase() !== user_entity_1.UserProfile.AGENTE) {
                throw new common_1.BadRequestException('Agente inválido');
            }
        }
        if (colaboradorId) {
            const colaborador = await this.usersRepository.findOne({ where: { id: colaboradorId } });
            if (!colaborador || String(colaborador.perfil).toUpperCase() !== user_entity_1.UserProfile.COLABORADOR) {
                throw new common_1.BadRequestException('Colaborador inválido');
            }
            if (vendedorId && Number(colaborador.usuario_id_pai) !== Number(vendedorId)) {
                throw new common_1.BadRequestException('Colaborador não pertence ao Agente selecionado');
            }
        }
        return { vendedor_id: vendedorId, usuario_id_colaborador: colaboradorId };
    }
    async findAll(currentUser) {
        this.ensureAdminOrAgente(currentUser);
        const query = this.landingPagesRepository
            .createQueryBuilder('lp')
            .leftJoinAndSelect('lp.vendedor', 'vendedor')
            .leftJoinAndSelect('lp.colaborador', 'colaborador')
            .orderBy('lp.created_at', 'DESC');
        if (this.isAgente(currentUser)) {
            query.where('lp.vendedor_id = :id', { id: Number(currentUser.id) });
        }
        return query.getMany();
    }
    async checkSlugAvailability(slug, excludeId) {
        const normalized = this.normalizeSlug(slug);
        if (!normalized) {
            return { available: false };
        }
        const where = { slug: normalized };
        if (excludeId)
            where.id = excludeId;
        const existing = await this.landingPagesRepository
            .createQueryBuilder('lp')
            .where('lp.slug = :slug', { slug: normalized })
            .andWhere(excludeId ? 'lp.id <> :excludeId' : '1=1', { excludeId })
            .getOne();
        return { available: !existing };
    }
    async create(dto, currentUser) {
        this.ensureAdminOrAgente(currentUser);
        const slug = this.normalizeSlug(dto.slug);
        const slugCheck = await this.checkSlugAvailability(slug);
        if (!slugCheck.available) {
            throw new common_1.BadRequestException('Esta chave já existe');
        }
        const assignments = await this.validateAssignments(dto, currentUser);
        const landingPage = this.landingPagesRepository.create({
            ...dto,
            slug,
            token: (0, crypto_1.randomUUID)(),
            font_size_principal: dto.font_size_principal ?? 24,
            font_size_secundaria: dto.font_size_secundaria ?? 12,
            background_color: dto.background_color ?? '#4A4A4A',
            font_color_primary: dto.font_color_primary ?? '#72EDED',
            font_color_secondary: dto.font_color_secondary ?? '#FFFFFF',
            vendedor_id: assignments.vendedor_id,
            usuario_id_colaborador: assignments.usuario_id_colaborador,
            dominio_autorizado: this.normalizeAuthorizedDomains(dto.dominio_autorizado),
            active: true,
        });
        const created = await this.landingPagesRepository.save(landingPage);
        if (dto.produtos_ids && dto.produtos_ids.length > 0) {
            await this.setProdutosForLandingPage(created.id, dto.produtos_ids, currentUser);
        }
        return created;
    }
    async update(id, dto, currentUser) {
        this.ensureAdminOrAgente(currentUser);
        const existing = await this.findOneInternal(id, currentUser);
        let slug = existing.slug;
        if (dto.slug && dto.slug !== existing.slug) {
            slug = this.normalizeSlug(dto.slug);
            const slugCheck = await this.checkSlugAvailability(slug, id);
            if (!slugCheck.available) {
                throw new common_1.BadRequestException('Esta chave já existe');
            }
        }
        const assignments = await this.validateAssignments({
            vendedor_id: dto.vendedor_id !== undefined ? dto.vendedor_id : existing.vendedor_id ?? undefined,
            usuario_id_colaborador: dto.usuario_id_colaborador !== undefined
                ? dto.usuario_id_colaborador
                : existing.usuario_id_colaborador ?? undefined,
        }, currentUser);
        Object.assign(existing, dto, {
            slug,
            vendedor_id: assignments.vendedor_id,
            usuario_id_colaborador: assignments.usuario_id_colaborador,
            dominio_autorizado: this.normalizeAuthorizedDomains(dto.dominio_autorizado),
        });
        const updated = await this.landingPagesRepository.save(existing);
        if (dto.produtos_ids) {
            await this.setProdutosForLandingPage(updated.id, dto.produtos_ids, currentUser);
        }
        return updated;
    }
    async toggleActive(id, currentUser) {
        this.ensureAdminOrAgente(currentUser);
        const existing = await this.findOneInternal(id, currentUser);
        existing.active = !existing.active;
        return this.landingPagesRepository.save(existing);
    }
    async findOneInternal(id, currentUser) {
        const landingPage = await this.landingPagesRepository.findOne({
            where: { id },
            relations: ['vendedor', 'colaborador'],
        });
        if (!landingPage) {
            throw new common_1.NotFoundException('Landing page não encontrada');
        }
        if (this.isAgente(currentUser) && Number(landingPage.vendedor_id) !== Number(currentUser.id)) {
            throw new common_1.ForbiddenException('Você não tem permissão para acessar esta landing page');
        }
        return landingPage;
    }
    async findProdutosByLandingPage(id, currentUser) {
        const lp = await this.findOneInternal(id, currentUser);
        const rows = await this.landingPageProdutoRepository
            .createQueryBuilder('lpp')
            .innerJoin(produto_entity_1.Produto, 'p', 'p.produto_id = lpp.produto_id')
            .where('lpp.landing_page_id = :id', { id: lp.id })
            .orderBy('p.descricao', 'ASC')
            .select(['lpp.produto_id AS produto_id', 'p.descricao AS descricao'])
            .getRawMany();
        return rows;
    }
    async setProdutosForLandingPage(landingPageId, produtoIds, currentUser) {
        await this.findOneInternal(landingPageId, currentUser);
        const uniqueIds = Array.from(new Set(produtoIds)).map((n) => Number(n)).filter(Boolean);
        if (uniqueIds.length === 0) {
            await this.landingPageProdutoRepository.delete({ landing_page_id: landingPageId });
            return;
        }
        const produtos = await this.produtosRepository
            .createQueryBuilder('p')
            .whereInIds(uniqueIds)
            .getMany();
        const foundIds = new Set(produtos.map((p) => p.produto_id));
        for (const id of uniqueIds) {
            if (!foundIds.has(id)) {
                throw new common_1.BadRequestException(`Produto ${id} inválido`);
            }
        }
        const invalidTipo = produtos.find((p) => Number(p.produto_tipo_id) !== 1);
        if (invalidTipo) {
            throw new common_1.BadRequestException(`Produto ${invalidTipo.produto_id} inválido`);
        }
        await this.landingPageProdutoRepository
            .createQueryBuilder()
            .delete()
            .from(landing_page_produto_entity_1.LandingPageProduto)
            .where('landing_page_id = :landingPageId', { landingPageId })
            .andWhere('produto_id NOT IN (:...ids)', { ids: uniqueIds })
            .execute();
        const existing = await this.landingPageProdutoRepository.find({
            where: { landing_page_id: landingPageId },
        });
        const existingIds = new Set(existing.map((e) => e.produto_id));
        const toInsert = [];
        for (const pid of uniqueIds) {
            if (!existingIds.has(pid)) {
                const row = this.landingPageProdutoRepository.create({
                    landing_page_id: landingPageId,
                    produto_id: pid,
                });
                toInsert.push(row);
            }
        }
        if (toInsert.length > 0) {
            await this.landingPageProdutoRepository.save(toInsert);
        }
    }
    async findPublicBySlug(slug) {
        const landingPage = await this.landingPagesRepository.findOne({
            where: { slug: this.normalizeSlug(slug) },
        });
        if (!landingPage) {
            throw new common_1.NotFoundException('Landing page não encontrada');
        }
        if (!landingPage.active) {
            throw new common_1.BadRequestException('Essa landing page não está ativa');
        }
        const products = await this.landingPageProdutoRepository
            .createQueryBuilder('lpp')
            .innerJoin(produto_entity_1.Produto, 'p', 'p.produto_id = lpp.produto_id')
            .where('lpp.landing_page_id = :id', { id: landingPage.id })
            .orderBy('p.descricao', 'ASC')
            .select(['lpp.produto_id AS produto_id', 'p.descricao AS descricao'])
            .getRawMany();
        return {
            id: landingPage.id,
            titulo: landingPage.titulo,
            texto_principal: landingPage.texto_principal,
            texto_secundario: landingPage.texto_secundario,
            font_size_principal: landingPage.font_size_principal,
            font_size_secundaria: landingPage.font_size_secundaria,
            background_color: landingPage.background_color,
            font_color_primary: landingPage.font_color_primary,
            font_color_secondary: landingPage.font_color_secondary,
            slug: landingPage.slug,
            token: landingPage.token,
            dominio_autorizado: landingPage.dominio_autorizado,
            products,
        };
    }
    async captureLead(dto, req) {
        if (!dto.nome?.trim()) {
            throw new common_1.BadRequestException('Necessário informar seu nome');
        }
        if (!dto.telefone?.trim()) {
            throw new common_1.BadRequestException('Necessário informar seu telefone');
        }
        const normalizedPhone = this.normalizePhone(dto.telefone);
        if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
            throw new common_1.BadRequestException('Necessário informar um telefone válido');
        }
        if (!dto.lead_msg_interesse?.trim()) {
            throw new common_1.BadRequestException('Necessário preencher informações de interesse');
        }
        if (!dto.slug?.trim()) {
            throw new common_1.BadRequestException('Landing page inválida (SLUG)');
        }
        if (!dto.token?.trim()) {
            throw new common_1.BadRequestException('Landing page inválida (TOKEN)');
        }
        const landingPage = await this.landingPagesRepository.findOne({
            where: { slug: this.normalizeSlug(dto.slug), token: dto.token.trim() },
        });
        if (!landingPage) {
            throw new common_1.BadRequestException('Landing Page não autorizada');
        }
        const allowedDomains = this.normalizeAuthorizedDomains(landingPage.dominio_autorizado)
            ?.split(';')
            .map((d) => d.trim())
            .filter(Boolean) || [];
        if (allowedDomains.length === 0) {
            throw new common_1.ForbiddenException('Esta landing page não possui domínio autorizado configurado');
        }
        const requestHostname = this.extractHostnameFromHeader(req?.headers?.origin || req?.headers?.referer);
        if (!requestHostname || !allowedDomains.includes(requestHostname)) {
            throw new common_1.ForbiddenException('Este domínio não está autorizado a enviar leads para esta configuração');
        }
        if (!landingPage.active) {
            throw new common_1.BadRequestException('Essa landing page não está ativa');
        }
        const phoneDigits = normalizedPhone.replace(/\D/g, '');
        const existingPhone = await this.leadsRepository
            .createQueryBuilder('lead')
            .where(`REGEXP_REPLACE(COALESCE(lead.telefone, ''), '[^0-9]', '', 'g') = :phoneDigits`, {
            phoneDigits,
        })
            .getOne();
        if (existingPhone) {
            throw new common_1.BadRequestException('Esse Telefone já foi registrado');
        }
        const productIds = Array.from(new Set(dto.products || [])).map((n) => Number(n)).filter(Boolean);
        if (productIds.length > 0) {
            const allowed = await this.landingPageProdutoRepository
                .createQueryBuilder('lpp')
                .where('lpp.landing_page_id = :lpId', { lpId: landingPage.id })
                .andWhere('lpp.produto_id IN (:...ids)', { ids: productIds })
                .getMany();
            const allowedIds = new Set(allowed.map((r) => r.produto_id));
            for (const pid of productIds) {
                if (!allowedIds.has(pid)) {
                    throw new common_1.BadRequestException(`Produto ${pid} inválido`);
                }
            }
        }
        await this.leadsRepository.manager.transaction(async (manager) => {
            const lead = manager.create(lead_entity_1.Lead, {
                data_entrada: new Date(),
                nome_razao_social: dto.nome.trim(),
                telefone: normalizedPhone,
                email: dto.email?.trim() || null,
                vendedor_id: landingPage.vendedor_id ?? null,
                usuario_id_colaborador: landingPage.usuario_id_colaborador ?? null,
                origem_lead: landingPage.slug,
                lead_msg_interesse: dto.lead_msg_interesse.trim(),
                lgpd_aceite: true,
                lgpd_data_aceite: new Date(dto.lgpd_data_aceite),
                lgpd_ip_origem: this.extractIp(req?.ip || ''),
                lgpd_versao_texto: dto.lgpd_versao_texto,
                tipo_lead: landingPage.tipo_fluxo ? [landingPage.tipo_fluxo] : null,
                municipio: dto.municipio?.trim() || null,
                uf: dto.uf?.trim()?.toUpperCase() || null,
            });
            try {
                await manager.save(lead_entity_1.Lead, lead);
            }
            catch (error) {
                if (error?.constraint === 'leads_origem_lead_check') {
                    throw new common_1.BadRequestException('Banco desatualizado para origem_lead. Remova a constraint leads_origem_lead_check para permitir slug dinâmico.');
                }
                throw error;
            }
            if (productIds.length > 0) {
                const existing = await manager
                    .getRepository(leads_produto_entity_1.LeadsProduto)
                    .createQueryBuilder('lp')
                    .where('lp.leads_id = :leadId', { leadId: lead.id || lead.leads_id || lead['leads_id'] })
                    .andWhere('lp.produto_id IN (:...ids)', { ids: productIds })
                    .getMany();
                const existingIds = new Set(existing.map((e) => e.produto_id));
                const toInsert = [];
                for (const pid of productIds) {
                    if (!existingIds.has(pid)) {
                        toInsert.push({
                            leads_id: lead.id || lead.leads_id || lead['leads_id'],
                            produto_id: pid,
                            insert_by_lead: true,
                        });
                    }
                }
                if (toInsert.length > 0) {
                    await manager.getRepository(leads_produto_entity_1.LeadsProduto).save(toInsert);
                }
            }
        });
        return { message: 'Lead capturado com sucesso' };
    }
};
exports.LandingPagesService = LandingPagesService;
exports.LandingPagesService = LandingPagesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(landing_page_entity_1.LandingPage)),
    __param(1, (0, typeorm_1.InjectRepository)(landing_page_produto_entity_1.LandingPageProduto)),
    __param(2, (0, typeorm_1.InjectRepository)(produto_entity_1.Produto)),
    __param(3, (0, typeorm_1.InjectRepository)(leads_produto_entity_1.LeadsProduto)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(5, (0, typeorm_1.InjectRepository)(lead_entity_1.Lead)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], LandingPagesService);
//# sourceMappingURL=landing-pages.service.js.map