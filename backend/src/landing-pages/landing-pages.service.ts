import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { LandingPage } from './entities/landing-page.entity';
import { LandingPageProduto } from './entities/landing-page-produto.entity';
import { User, UserProfile } from '../users/entities/user.entity';
import { CreateLandingPageDto } from './dto/create-landing-page.dto';
import { UpdateLandingPageDto } from './dto/update-landing-page.dto';
import { CaptureLeadDto } from './dto/capture-lead.dto';
import { Lead } from '../leads/entities/lead.entity';
import { Produto } from '../produtos/entities/produto.entity';
import { LeadsProduto } from '../leads-produtos/entities/leads-produto.entity';

@Injectable()
export class LandingPagesService {
  constructor(
    @InjectRepository(LandingPage)
    private readonly landingPagesRepository: Repository<LandingPage>,
    @InjectRepository(LandingPageProduto)
    private readonly landingPageProdutoRepository: Repository<LandingPageProduto>,
    @InjectRepository(Produto)
    private readonly produtosRepository: Repository<Produto>,
    @InjectRepository(LeadsProduto)
    private readonly leadsProdutoRepository: Repository<LeadsProduto>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Lead)
    private readonly leadsRepository: Repository<Lead>,
  ) {}

  private normalizeSlug(slug: string): string {
    return slug
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private normalizePhone(telefone: string): string {
    const onlyDigits = (telefone || '').replace(/\D/g, '');
    if (!onlyDigits) return '';
    return `+${onlyDigits}`;
  }

  private normalizeAuthorizedDomains(value?: string | null): string | null {
    if (!value) return null;

    const domains = value
      .split(';')
      .map((domain) => domain.trim().toLowerCase())
      .map((domain) => domain.replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
      .filter(Boolean);

    if (domains.length === 0) return null;
    return domains.join(';');
  }

  private extractHostnameFromHeader(originOrReferer?: string): string {
    if (!originOrReferer) return '';
    try {
      const hostname = new URL(originOrReferer).hostname.toLowerCase();
      return hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  private extractIp(reqIp: string): string {
    if (!reqIp) return '';
    if (reqIp.startsWith('::ffff:')) {
      return reqIp.replace('::ffff:', '');
    }
    return reqIp;
  }

  private isAdmin(user: User): boolean {
    return String(user.perfil).toUpperCase() === UserProfile.ADMIN;
  }

  private isAgente(user: User): boolean {
    return String(user.perfil).toUpperCase() === UserProfile.AGENTE;
  }

  private ensureAdminOrAgente(user: User): void {
    if (!this.isAdmin(user) && !this.isAgente(user)) {
      throw new ForbiddenException('Acesso permitido apenas para Admin ou Agente');
    }
  }

  private async validateAssignments(
    data: { vendedor_id?: number; usuario_id_colaborador?: number },
    currentUser: User,
  ): Promise<{ vendedor_id: number | null; usuario_id_colaborador: number | null }> {
    let vendedorId = data.vendedor_id ?? null;
    const colaboradorId = data.usuario_id_colaborador ?? null;

    if (this.isAgente(currentUser)) {
      vendedorId = Number(currentUser.id);
    }

    if (vendedorId) {
      const vendedor = await this.usersRepository.findOne({ where: { id: vendedorId } });
      if (!vendedor || String(vendedor.perfil).toUpperCase() !== UserProfile.AGENTE) {
        throw new BadRequestException('Agente inválido');
      }
    }

    if (colaboradorId) {
      const colaborador = await this.usersRepository.findOne({ where: { id: colaboradorId } });
      if (!colaborador || String(colaborador.perfil).toUpperCase() !== UserProfile.COLABORADOR) {
        throw new BadRequestException('Colaborador inválido');
      }

      if (vendedorId && Number(colaborador.usuario_id_pai) !== Number(vendedorId)) {
        throw new BadRequestException('Colaborador não pertence ao Agente selecionado');
      }
    }

    return { vendedor_id: vendedorId, usuario_id_colaborador: colaboradorId };
  }

  async findAll(currentUser: User): Promise<LandingPage[]> {
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

  async checkSlugAvailability(slug: string, excludeId?: number): Promise<{ available: boolean }> {
    const normalized = this.normalizeSlug(slug);
    if (!normalized) {
      return { available: false };
    }

    const where: any = { slug: normalized };
    if (excludeId) where.id = excludeId as any;

    const existing = await this.landingPagesRepository
      .createQueryBuilder('lp')
      .where('lp.slug = :slug', { slug: normalized })
      .andWhere(excludeId ? 'lp.id <> :excludeId' : '1=1', { excludeId })
      .getOne();

    return { available: !existing };
  }

  async create(dto: CreateLandingPageDto, currentUser: User): Promise<LandingPage> {
    this.ensureAdminOrAgente(currentUser);

    const slug = this.normalizeSlug(dto.slug);
    const slugCheck = await this.checkSlugAvailability(slug);
    if (!slugCheck.available) {
      throw new BadRequestException('Esta chave já existe');
    }

    const assignments = await this.validateAssignments(dto, currentUser);

    const landingPage = this.landingPagesRepository.create({
      ...dto,
      slug,
      token: randomUUID(),
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

    // Vincula produtos (opcional) — apenas produtos de tipo 1, ordenação não é necessária aqui
    if (dto.produtos_ids && dto.produtos_ids.length > 0) {
      await this.setProdutosForLandingPage(created.id, dto.produtos_ids, currentUser);
    }

    return created;
  }

  async update(id: number, dto: UpdateLandingPageDto, currentUser: User): Promise<LandingPage> {
    this.ensureAdminOrAgente(currentUser);
    const existing = await this.findOneInternal(id, currentUser);

    let slug = existing.slug;
    if (dto.slug && dto.slug !== existing.slug) {
      slug = this.normalizeSlug(dto.slug);
      const slugCheck = await this.checkSlugAvailability(slug, id);
      if (!slugCheck.available) {
        throw new BadRequestException('Esta chave já existe');
      }
    }

    const assignments = await this.validateAssignments(
      {
        vendedor_id:
          dto.vendedor_id !== undefined ? dto.vendedor_id : existing.vendedor_id ?? undefined,
        usuario_id_colaborador:
          dto.usuario_id_colaborador !== undefined
            ? dto.usuario_id_colaborador
            : existing.usuario_id_colaborador ?? undefined,
      },
      currentUser,
    );

    Object.assign(existing, dto, {
      slug,
      vendedor_id: assignments.vendedor_id,
      usuario_id_colaborador: assignments.usuario_id_colaborador,
      dominio_autorizado: this.normalizeAuthorizedDomains(dto.dominio_autorizado),
    });

    const updated = await this.landingPagesRepository.save(existing);

    // Atualiza vínculos de produtos se enviados
    if (dto.produtos_ids) {
      await this.setProdutosForLandingPage(updated.id, dto.produtos_ids, currentUser);
    }

    return updated;
  }

  async toggleActive(id: number, currentUser: User): Promise<LandingPage> {
    this.ensureAdminOrAgente(currentUser);
    const existing = await this.findOneInternal(id, currentUser);
    existing.active = !existing.active;
    return this.landingPagesRepository.save(existing);
  }

  private async findOneInternal(id: number, currentUser: User): Promise<LandingPage> {
    const landingPage = await this.landingPagesRepository.findOne({
      where: { id },
      relations: ['vendedor', 'colaborador'],
    });

    if (!landingPage) {
      throw new NotFoundException('Landing page não encontrada');
    }

    if (this.isAgente(currentUser) && Number(landingPage.vendedor_id) !== Number(currentUser.id)) {
      throw new ForbiddenException('Você não tem permissão para acessar esta landing page');
    }

    return landingPage;
  }

  /**
   * Lista produtos vinculados a uma Landing Page (somente ids e descrição para UI)
   */
  async findProdutosByLandingPage(
    id: number,
    currentUser: User,
  ): Promise<{ produto_id: number; descricao: string }[]> {
    const lp = await this.findOneInternal(id, currentUser);
    // Junta com tabela produto para ordenar alfabeticamente por descrição
    const rows = await this.landingPageProdutoRepository
      .createQueryBuilder('lpp')
      .innerJoin(Produto, 'p', 'p.produto_id = lpp.produto_id')
      .where('lpp.landing_page_id = :id', { id: lp.id })
      .orderBy('p.descricao', 'ASC')
      .select(['lpp.produto_id AS produto_id', 'p.descricao AS descricao'])
      .getRawMany<{ produto_id: number; descricao: string }>();

    return rows;
  }

  /**
   * Define o conjunto de produtos vinculados à LP, validando que são do tipo 1.
   * Remove vínculos não enviados e insere os faltantes.
   */
  private async setProdutosForLandingPage(
    landingPageId: number,
    produtoIds: number[],
    currentUser: User,
  ): Promise<void> {
    await this.findOneInternal(landingPageId, currentUser);

    const uniqueIds = Array.from(new Set(produtoIds)).map((n) => Number(n)).filter(Boolean);
    if (uniqueIds.length === 0) {
      // Remove todos os vínculos se lista vazia
      await this.landingPageProdutoRepository.delete({ landing_page_id: landingPageId } as any);
      return;
    }

    // Valida produtos existentes e tipo 1
    const produtos = await this.produtosRepository
      .createQueryBuilder('p')
      .whereInIds(uniqueIds)
      .getMany();

    const foundIds = new Set(produtos.map((p) => p.produto_id));
    for (const id of uniqueIds) {
      if (!foundIds.has(id)) {
        throw new BadRequestException(`Produto ${id} inválido`);
      }
    }

    // Filtra somente produto_tipo_id = 1
    const invalidTipo = produtos.find((p) => Number(p.produto_tipo_id) !== 1);
    if (invalidTipo) {
      throw new BadRequestException(`Produto ${invalidTipo.produto_id} inválido`);
    }

    // Remove vínculos que não estão na nova lista
    await this.landingPageProdutoRepository
      .createQueryBuilder()
      .delete()
      .from(LandingPageProduto)
      .where('landing_page_id = :landingPageId', { landingPageId })
      .andWhere('produto_id NOT IN (:...ids)', { ids: uniqueIds })
      .execute();

    // Busca vínculos existentes para evitar duplicidade
    const existing = await this.landingPageProdutoRepository.find({
      where: { landing_page_id: landingPageId } as any,
    });
    const existingIds = new Set(existing.map((e) => e.produto_id));

    const toInsert: LandingPageProduto[] = [];
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

  async findPublicBySlug(slug: string): Promise<Partial<LandingPage> & { products: { produto_id: number; descricao: string }[] }> {
    const landingPage = await this.landingPagesRepository.findOne({
      where: { slug: this.normalizeSlug(slug) },
    });

    if (!landingPage) {
      throw new NotFoundException('Landing page não encontrada');
    }

    if (!landingPage.active) {
      throw new BadRequestException('Essa landing page não está ativa');
    }

    // Busca produtos vinculados ordenados por descrição
    const products = await this.landingPageProdutoRepository
      .createQueryBuilder('lpp')
      .innerJoin(Produto, 'p', 'p.produto_id = lpp.produto_id')
      .where('lpp.landing_page_id = :id', { id: landingPage.id })
      .orderBy('p.descricao', 'ASC')
      .select(['lpp.produto_id AS produto_id', 'p.descricao AS descricao'])
      .getRawMany<{ produto_id: number; descricao: string }>();

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

  async captureLead(dto: CaptureLeadDto, req: any): Promise<{ message: string }> {
    if (!dto.nome?.trim()) {
      throw new BadRequestException('Necessário informar seu nome');
    }

    if (!dto.telefone?.trim()) {
      throw new BadRequestException('Necessário informar seu telefone');
    }

    const normalizedPhone = this.normalizePhone(dto.telefone);
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      throw new BadRequestException('Necessário informar um telefone válido');
    }

    if (!dto.lead_msg_interesse?.trim()) {
      throw new BadRequestException('Necessário preencher informações de interesse');
    }

    if (!dto.slug?.trim()) {
      throw new BadRequestException('Landing page inválida (SLUG)');
    }

    if (!dto.token?.trim()) {
      throw new BadRequestException('Landing page inválida (TOKEN)');
    }

    const landingPage = await this.landingPagesRepository.findOne({
      where: { slug: this.normalizeSlug(dto.slug), token: dto.token.trim() },
    });

    if (!landingPage) {
      throw new BadRequestException('Landing Page não autorizada');
    }

    const allowedDomains =
      this.normalizeAuthorizedDomains(landingPage.dominio_autorizado)
        ?.split(';')
        .map((d) => d.trim())
        .filter(Boolean) || [];

    if (allowedDomains.length === 0) {
      throw new ForbiddenException(
        'Esta landing page não possui domínio autorizado configurado',
      );
    }

    const requestHostname = this.extractHostnameFromHeader(
      req?.headers?.origin || req?.headers?.referer,
    );

    if (!requestHostname || !allowedDomains.includes(requestHostname)) {
      throw new ForbiddenException(
        'Este domínio não está autorizado a enviar leads para esta configuração',
      );
    }

    if (!landingPage.active) {
      throw new BadRequestException('Essa landing page não está ativa');
    }

    // Validação de produtos vinculados à LP (se enviados)
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
          throw new BadRequestException(`Produto ${pid} inválido`);
        }
      }
    }

    await this.leadsRepository.manager.transaction(async (manager) => {
      const tipoFluxoKanban = (landingPage.tipo_fluxo || 'COMPRADOR') as 'COMPRADOR' | 'VENDEDOR';

      const lead = manager.create(Lead, {
        data_entrada: new Date(),
        nome_razao_social: dto.nome.trim(),
        telefone: normalizedPhone,
        email: dto.email?.trim() || null,
        vendedor_id: landingPage.vendedor_id ?? null,
        usuario_id_colaborador: landingPage.usuario_id_colaborador ?? null,
        origem_lead: landingPage.slug as any,
        lead_msg_interesse: dto.lead_msg_interesse.trim(),
        lgpd_aceite: true,
        lgpd_data_aceite: new Date(dto.lgpd_data_aceite),
        lgpd_ip_origem: this.extractIp(req?.ip || ''),
        lgpd_versao_texto: dto.lgpd_versao_texto,
        tipo_lead: landingPage.tipo_fluxo ? [landingPage.tipo_fluxo] : landingPage.vendedor_id ? [tipoFluxoKanban] : null,
        municipio: dto.municipio?.trim() || null,
        uf: dto.uf?.trim()?.toUpperCase() || null,
      } as any);

      let savedLead: Lead;
      try {
        savedLead = await manager.save(Lead, lead);
      } catch (error: any) {
        if (error?.constraint === 'leads_origem_lead_check') {
          throw new BadRequestException(
            'Banco desatualizado para origem_lead. Remova a constraint leads_origem_lead_check para permitir slug dinâmico.',
          );
        }
        throw error;
      }

      // Mesma regra de createLeadInBoard: sem linha em lead_kanban_status o lead não aparece no Kanban do agente.
      if (landingPage.vendedor_id != null) {
        await manager.query(
          `INSERT INTO lead_kanban_status
           (lead_id, tipo_fluxo, vendedor_id, usuario_id_colaborador, kanban_status_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [
            savedLead.id,
            tipoFluxoKanban,
            landingPage.vendedor_id,
            landingPage.usuario_id_colaborador ?? null,
            null,
          ],
        );
      }

      // Persiste produtos selecionados com insert_by_lead = true (sem duplicidade)
      if (productIds.length > 0) {
        const existing = await manager
          .getRepository(LeadsProduto)
          .createQueryBuilder('lp')
          .where('lp.leads_id = :leadId', { leadId: savedLead.id })
          .andWhere('lp.produto_id IN (:...ids)', { ids: productIds })
          .getMany();
        const existingIds = new Set(existing.map((e) => e.produto_id));

        const toInsert: Partial<LeadsProduto>[] = [];
        for (const pid of productIds) {
          if (!existingIds.has(pid)) {
            toInsert.push({
              leads_id: savedLead.id,
              produto_id: pid,
              insert_by_lead: true,
            });
          }
        }
        if (toInsert.length > 0) {
          await manager.getRepository(LeadsProduto).save(toInsert as any);
        }
      }
    });

    return { message: 'Lead capturado com sucesso' };
  }
}

