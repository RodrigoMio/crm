import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { User, UserProfile } from '../users/entities/user.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { FilterLeadsDto } from './dto/filter-leads.dto';
import { Produto } from '../produtos/entities/produto.entity';
import { Ocorrencia } from '../ocorrencias/entities/ocorrencia.entity';
import { LeadOcorrencia } from '../lead-ocorrencias/entities/lead-ocorrencia.entity';
import { LeadsProduto } from '../leads-produtos/entities/leads-produto.entity';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private leadsRepository: Repository<Lead>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Produto)
    private produtoRepository: Repository<Produto>,
    @InjectRepository(Ocorrencia)
    private ocorrenciaRepository: Repository<Ocorrencia>,
    @InjectRepository(LeadOcorrencia)
    private leadOcorrenciaRepository: Repository<LeadOcorrencia>,
    @InjectRepository(LeadsProduto)
    private leadsProdutoRepository: Repository<LeadsProduto>,
    private dataSource: DataSource,
  ) {}

  /**
   * Normaliza ID para number (garante que comparações funcionem corretamente)
   */
  private normalizeId(id: any): number {
    if (typeof id === 'string') {
      return parseInt(id, 10);
    }
    return Number(id);
  }

  /**
   * Cria um novo lead
   * Regras:
   * - Admin pode criar qualquer lead
   * - Agente só pode criar leads atribuídos a ele mesmo
   * - Colaborador não pode criar leads (apenas visualizar)
   */
  async create(createLeadDto: CreateLeadDto, currentUser: User): Promise<Lead> {
    // Colaborador não pode criar leads
    if (currentUser.perfil === UserProfile.COLABORADOR) {
      throw new ForbiddenException('Colaborador não pode criar leads');
    }

    // Valida vendedor se fornecido
    if (createLeadDto.vendedor_id) {
      const vendedor = await this.usersRepository.findOne({
        where: { id: createLeadDto.vendedor_id },
      });

      if (!vendedor) {
        throw new NotFoundException('Vendedor não encontrado');
      }

      if (vendedor.perfil !== UserProfile.AGENTE) {
        throw new ForbiddenException('Vendedor deve ser um Agente');
      }

      // Se o usuário é Agente, só pode criar leads para ele mesmo
      if (currentUser.perfil === UserProfile.AGENTE) {
        const currentUserId = this.normalizeId(currentUser.id);
        const vendedorId = this.normalizeId(createLeadDto.vendedor_id);
        if (vendedorId !== currentUserId) {
          throw new ForbiddenException('Agente só pode criar leads para si mesmo');
        }
      }
    }

    // Valida colaborador se fornecido
    if (createLeadDto.usuario_id_colaborador) {
      const colaborador = await this.usersRepository.findOne({
        where: { id: createLeadDto.usuario_id_colaborador },
      });

      if (!colaborador) {
        throw new NotFoundException('Colaborador não encontrado');
      }

      if (colaborador.perfil !== UserProfile.COLABORADOR) {
        throw new ForbiddenException('usuario_id_colaborador deve ser um Colaborador');
      }

      // Se o usuário é Agente, só pode atribuir a seus próprios colaboradores
      if (currentUser.perfil === UserProfile.AGENTE) {
        const currentUserId = this.normalizeId(currentUser.id);
        const colaboradorPaiId = colaborador.usuario_id_pai ? this.normalizeId(colaborador.usuario_id_pai) : null;
        if (colaboradorPaiId !== currentUserId) {
          throw new ForbiddenException('Agente só pode atribuir leads a seus próprios colaboradores');
        }
      }
    }

    // Remove produtos do DTO antes de criar o lead
    const { produtos, ...leadData } = createLeadDto;

    const lead = this.leadsRepository.create({
      ...leadData,
      data_entrada: createLeadDto.data_entrada || new Date(),
    });

    const savedLead = await this.leadsRepository.save(lead);

    // Processa produtos se fornecidos
    if (produtos && produtos.length > 0) {
      await this.syncProdutos(savedLead.id, produtos);
    }

    // Retorna lead com produtos
    return this.findOne(savedLead.id, currentUser);
  }

  /**
   * Retorna o maior ID cadastrado na tabela leads
   * Útil para referência na importação de planilhas
   */
  async getMaxId(): Promise<number | null> {
    const result = await this.leadsRepository
      .createQueryBuilder('lead')
      .select('MAX(lead.id)', 'maxId')
      .getRawOne();
    
    return result?.maxId ? parseInt(result.maxId, 10) : null;
  }

  /**
   * Lista leads com filtros e paginação
   * Regras de visibilidade:
   * - Admin vê todos os leads
   * - Agente vê apenas seus próprios leads
   */
  async findAll(filterDto: FilterLeadsDto, currentUser: User): Promise<{
    data: Lead[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = filterDto.page || 1;
    const limit = filterDto.limit || 100;
    const skip = (page - 1) * limit;

    // Cria query builder
    const queryBuilder = this.leadsRepository
      .createQueryBuilder('lead')
      .leftJoinAndSelect('lead.vendedor', 'vendedor')
      .leftJoinAndSelect('lead.colaborador', 'colaborador')
      .leftJoinAndSelect('lead.kanbanStatus', 'kanbanStatus');

    // Regras de visibilidade:
    // - ADMIN vê tudo
    // - AGENTE vê leads onde vendedor_id = agente.id OU usuario_id_colaborador pertence aos seus colaboradores
    // - COLABORADOR vê apenas leads onde usuario_id_colaborador = colaborador.id
    
    // Normaliza o perfil para comparação (pode vir como string do banco)
    const userPerfil = String(currentUser.perfil).toUpperCase();
    
    // Log para debug
    console.log('[LeadsService] Perfil do usuário:', currentUser.perfil, 'Normalizado:', userPerfil);
    console.log('[LeadsService] UserProfile.COLABORADOR:', UserProfile.COLABORADOR);
    
    if (userPerfil === UserProfile.AGENTE) {
      // Agente vê seus próprios leads E leads de seus colaboradores
      // Garante que userId é number
      const userId = typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id;
      
      // Busca IDs dos colaboradores do agente
      const colaboradoresDoAgente = await this.usersRepository.find({
        where: { 
          usuario_id_pai: userId, 
          perfil: UserProfile.COLABORADOR 
        },
        select: ['id'],
      });
      const idsColaboradores = colaboradoresDoAgente.map(c => this.normalizeId(c.id));

      if (idsColaboradores.length > 0) {
        queryBuilder.where(
          '(lead.vendedor_id = :userId OR lead.usuario_id_colaborador IN (:...colaboradorIds))',
          { 
            userId,
            colaboradorIds: idsColaboradores
          }
        );
      } else {
        // Se não tem colaboradores, vê apenas seus próprios leads
        queryBuilder.where('lead.vendedor_id = :userId', { userId });
      }
    } else if (userPerfil === UserProfile.COLABORADOR) {
      // Colaborador vê apenas leads atribuídos a ele
      // Garante que userId é number
      const userId = typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id;
      console.log('[LeadsService] Colaborador - userId:', userId, 'tipo:', typeof userId);
      queryBuilder.where('lead.usuario_id_colaborador = :userId', { userId });
    } else if (userPerfil !== UserProfile.ADMIN) {
      // Se não for ADMIN, AGENTE ou COLABORADOR, não retorna nada (segurança)
      console.log('[LeadsService] Perfil desconhecido:', userPerfil);
      queryBuilder.where('1 = 0'); // Query que nunca retorna resultados
    }
    // Admin não precisa de filtro (vê tudo)

    // Filtro por nome/razão social (busca parcial, case-insensitive e sem acentos)
    // Normaliza acentos para buscar "Jose" e encontrar "José", "João" e encontrar "Joao"
    if (filterDto.nome_razao_social) {
      const fromChars = 'áàâãäéèêëíìîïóòôõöúùûüçñýÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑÝ';
      const toChars = 'aaaaaeeeeiiiiooooouuuucnyAAAAAEEEEIIIIOOOOOUUUUCNY';
      
      queryBuilder.andWhere(
        `translate(LOWER(lead.nome_razao_social), :fromChars, :toChars) ILIKE translate(LOWER(:nome), :fromChars, :toChars)`,
        { 
          nome: `%${filterDto.nome_razao_social.trim()}%`,
          fromChars,
          toChars
        },
      );
    }

    // Filtro por UF
    if (filterDto.uf) {
      queryBuilder.andWhere('lead.uf = :uf', { uf: filterDto.uf });
    }

    // Filtro por vendedor (apenas Admin pode filtrar por outro vendedor)
    if (filterDto.vendedor_id) {
      if (currentUser.perfil === UserProfile.AGENTE) {
        // Agente não pode filtrar por outro vendedor
        const currentUserId = this.normalizeId(currentUser.id);
        const vendedorId = this.normalizeId(filterDto.vendedor_id);
        if (vendedorId !== currentUserId) {
          throw new ForbiddenException('Agente não pode filtrar por outro vendedor');
        }
      }
      const vendedorId = this.normalizeId(filterDto.vendedor_id);
      queryBuilder.andWhere('lead.vendedor_id = :vendedorId', { vendedorId });
    }

    // Filtro por colaborador
    if (filterDto.usuario_id_colaborador) {
      // Agente só pode filtrar por seus próprios colaboradores
      if (currentUser.perfil === UserProfile.AGENTE) {
        const colaborador = await this.usersRepository.findOne({
          where: { id: filterDto.usuario_id_colaborador },
        });
        const currentUserId = this.normalizeId(currentUser.id);
        const colaboradorPaiId = colaborador.usuario_id_pai ? this.normalizeId(colaborador.usuario_id_pai) : null;
        if (!colaborador || colaboradorPaiId !== currentUserId) {
          throw new ForbiddenException('Agente só pode filtrar por seus próprios colaboradores');
        }
      }
      // Colaborador só pode ver seus próprios leads (já filtrado acima)
      if (currentUser.perfil === UserProfile.COLABORADOR) {
        const currentUserId = this.normalizeId(currentUser.id);
        const colaboradorId = this.normalizeId(filterDto.usuario_id_colaborador);
        if (colaboradorId !== currentUserId) {
          throw new ForbiddenException('Colaborador só pode ver seus próprios leads');
        }
      }
      const colaboradorId = this.normalizeId(filterDto.usuario_id_colaborador);
      queryBuilder.andWhere('lead.usuario_id_colaborador = :colaboradorId', { 
        colaboradorId
      });
    }

    // Filtro por origem do lead
    if (filterDto.origem_lead) {
      queryBuilder.andWhere('lead.origem_lead = :origemLead', { origemLead: filterDto.origem_lead });
    }

    // Filtro por produtos (OR - lead deve ter PELO MENOS UM dos produtos selecionados)
    if (filterDto.produtos && filterDto.produtos.length > 0) {
      queryBuilder.andWhere(
        `EXISTS (SELECT 1 FROM leads_produto WHERE leads_produto.leads_id = lead.id AND leads_produto.produto_id IN (:...produtoIds))`,
        {
          produtoIds: filterDto.produtos,
        }
      );
    }

    queryBuilder.orderBy('lead.created_at', 'DESC');

    // Conta o total de registros
    const total = await queryBuilder.getCount();

    // Aplica paginação
    queryBuilder.skip(skip).take(limit);

    // Busca os dados
    try {
      // Log para debug
      console.log('[LeadsService] Buscando leads para usuário:', {
        id: currentUser.id,
        perfil: currentUser.perfil,
        userPerfil,
        tipoId: typeof currentUser.id,
      });

      // Log da query SQL antes de executar
      const sql = queryBuilder.getSql();
      const params = queryBuilder.getParameters();
      console.log('[LeadsService] Query SQL:', sql);
      console.log('[LeadsService] Parâmetros:', params);

      const data = await queryBuilder.getMany();

      console.log('[LeadsService] Leads encontrados:', data.length);
      
      // Adiciona colaborador manualmente se necessário (já que removemos o join)
      for (const lead of data) {
        if (lead.usuario_id_colaborador && !lead.colaborador) {
          try {
            const colaborador = await this.usersRepository.findOne({
              where: { id: lead.usuario_id_colaborador },
              select: ['id', 'nome', 'email'],
            });
            if (colaborador) {
              (lead as any).colaborador = colaborador;
            }
          } catch (err) {
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
    } catch (error) {
      console.error('[LeadsService] Erro ao buscar leads:', error);
      console.error('[LeadsService] Query SQL:', queryBuilder.getSql());
      console.error('[LeadsService] Parâmetros:', queryBuilder.getParameters());
      console.error('[LeadsService] Stack:', error.stack);
      throw new BadRequestException(`Erro ao buscar leads: ${error.message}`);
    }
  }

  /**
   * Busca um lead por ID
   * Regras de visibilidade:
   * - Admin pode ver qualquer lead
   * - Agente pode ver seus próprios leads E leads de seus colaboradores
   * - Colaborador só pode ver leads atribuídos a ele
   */
  async findOne(id: number, currentUser: User): Promise<Lead> {
    const lead = await this.leadsRepository.findOne({
      where: { id },
      relations: ['vendedor', 'colaborador'],
    });

    if (!lead) {
      throw new NotFoundException('Lead não encontrado');
    }

    // Verifica permissão de visualização
    const currentUserId = this.normalizeId(currentUser.id);
    const leadVendedorId = this.normalizeId(lead.vendedor_id);
    
    if (currentUser.perfil === UserProfile.AGENTE) {
      // Agente vê se é seu lead OU se o colaborador é dele
      if (leadVendedorId !== currentUserId) {
        if (lead.usuario_id_colaborador) {
          const colaborador = await this.usersRepository.findOne({
            where: { id: lead.usuario_id_colaborador },
          });
          const colaboradorPaiId = colaborador?.usuario_id_pai ? this.normalizeId(colaborador.usuario_id_pai) : null;
          if (!colaborador || colaboradorPaiId !== currentUserId) {
            throw new ForbiddenException('Você não tem permissão para ver este lead');
          }
        } else {
          throw new ForbiddenException('Você não tem permissão para ver este lead');
        }
      }
    } else if (currentUser.perfil === UserProfile.COLABORADOR) {
      // Colaborador só vê leads atribuídos a ele
      const leadColaboradorId = lead.usuario_id_colaborador ? this.normalizeId(lead.usuario_id_colaborador) : null;
      if (leadColaboradorId !== currentUserId) {
        throw new ForbiddenException('Você não tem permissão para ver este lead');
      }
    }
    // Admin pode ver tudo (não precisa verificar)

    // Busca produtos relacionados
    const leadsProdutos = await this.leadsProdutoRepository.find({
      where: { leads_id: id },
      relations: ['produto'],
    });

    // Adiciona produtos ao lead
    (lead as any).produtos = leadsProdutos.map(lp => lp.produto);

    return lead;
  }

  /**
   * Atualiza um lead
   * Regras:
   * - Admin pode atualizar qualquer lead e alterar vendedor_id
   * - Agente só pode atualizar seus próprios leads e alterar usuario_id_colaborador (apenas seus colaboradores)
   * - Colaborador não pode editar leads (apenas visualizar)
   */
  async update(id: number, updateLeadDto: UpdateLeadDto, currentUser: User): Promise<Lead> {
    const lead = await this.findOne(id, currentUser);

    // Colaborador não pode editar
    if (currentUser.perfil === UserProfile.COLABORADOR) {
      throw new ForbiddenException('Colaborador não pode editar leads');
    }

    // Se estiver atualizando vendedor, valida (apenas Admin)
    // Só valida se vendedor_id foi explicitamente enviado e é diferente do atual
    if (updateLeadDto.vendedor_id !== undefined) {
      if (updateLeadDto.vendedor_id === null) {
        // Permitir remover vendedor
        lead.vendedor_id = null;
      } else {
        const leadVendedorId = lead.vendedor_id ? this.normalizeId(lead.vendedor_id) : null;
        const updateVendedorId = this.normalizeId(updateLeadDto.vendedor_id);
        
        if (updateVendedorId !== leadVendedorId) {
          if (currentUser.perfil === UserProfile.AGENTE) {
            throw new ForbiddenException('Agente não pode alterar vendedor_id');
          }

          const vendedor = await this.usersRepository.findOne({
            where: { id: updateVendedorId },
          });

          if (!vendedor) {
            throw new NotFoundException('Vendedor não encontrado');
          }

          if (vendedor.perfil !== UserProfile.AGENTE) {
            throw new ForbiddenException('Vendedor deve ser um Agente');
          }

          lead.vendedor_id = updateVendedorId;
        }
      }
    }

    // Se estiver atualizando colaborador, valida
    if (updateLeadDto.usuario_id_colaborador !== undefined) {
      if (updateLeadDto.usuario_id_colaborador === null) {
        // Permitir remover colaborador
        lead.usuario_id_colaborador = null;
      } else {
        const colaborador = await this.usersRepository.findOne({
          where: { id: updateLeadDto.usuario_id_colaborador },
        });

        if (!colaborador) {
          throw new NotFoundException('Colaborador não encontrado');
        }

        if (colaborador.perfil !== UserProfile.COLABORADOR) {
          throw new ForbiddenException('usuario_id_colaborador deve ser um Colaborador');
        }

        // Se o usuário é Agente, só pode atribuir a seus próprios colaboradores
        if (currentUser.perfil === UserProfile.AGENTE) {
          const currentUserId = this.normalizeId(currentUser.id);
          const colaboradorPaiId = colaborador.usuario_id_pai ? this.normalizeId(colaborador.usuario_id_pai) : null;
          if (colaboradorPaiId !== currentUserId) {
            throw new ForbiddenException('Agente só pode atribuir leads a seus próprios colaboradores');
          }
        }

        lead.usuario_id_colaborador = updateLeadDto.usuario_id_colaborador;
      }
    }

    // Atualiza outros campos (exceto vendedor_id para Agente)
    // Remove produtos do DTO antes de atualizar o lead
    const { produtos, ...updateData } = updateLeadDto;

    if (currentUser.perfil === UserProfile.ADMIN) {
      Object.assign(lead, updateData);
    } else {
      // Agente não pode alterar vendedor_id
      const { vendedor_id, ...dataWithoutVendedor } = updateData;
      Object.assign(lead, dataWithoutVendedor);
    }

    const savedLead = await this.leadsRepository.save(lead);

    // Processa produtos se fornecidos (undefined significa não alterar, array vazio significa remover todos)
    if (produtos !== undefined) {
      await this.syncProdutos(savedLead.id, produtos);
    }

    // Retorna lead com produtos
    return this.findOne(savedLead.id, currentUser);
  }

  /**
   * Remove um lead
   * Regras:
   * - Admin pode remover qualquer lead
   * - Agente só pode remover seus próprios leads
   * - Colaborador não pode remover leads
   */
  async remove(id: number, currentUser: User): Promise<void> {
    const lead = await this.findOne(id, currentUser);

    // Colaborador não pode remover
    if (currentUser.perfil === UserProfile.COLABORADOR) {
      throw new ForbiddenException('Colaborador não pode remover leads');
    }

    // Agente só pode remover seus próprios leads (não de colaboradores)
    if (currentUser.perfil === UserProfile.AGENTE) {
      const currentUserId = this.normalizeId(currentUser.id);
      const leadVendedorId = this.normalizeId(lead.vendedor_id);
      if (leadVendedorId !== currentUserId) {
        throw new ForbiddenException('Agente só pode remover seus próprios leads');
      }
    }

    await this.leadsRepository.remove(lead);
  }

  /**
   * Busca ou cria um produto (usando manager da transação)
   * Busca case-insensitive com trim
   */
  private async findOrCreateProduto(manager: any, descricao: string): Promise<Produto> {
    const descricaoNormalizada = descricao.trim();
    
    // Busca case-insensitive
    const produto = await manager
      .createQueryBuilder(Produto, 'produto')
      .where('LOWER(produto.descricao) = LOWER(:descricao)', { descricao: descricaoNormalizada })
      .getOne();

    if (produto) {
      return produto;
    }

    // Cria novo produto
    const novoProduto = manager.create(Produto, {
      descricao: descricaoNormalizada,
    });
    return await manager.save(Produto, novoProduto);
  }

  /**
   * Busca ou cria uma ocorrência (usando manager da transação)
   * Busca case-insensitive com trim
   */
  private async findOrCreateOcorrencia(manager: any, descricao: string): Promise<Ocorrencia> {
    const descricaoNormalizada = descricao.trim();
    
    // Busca case-insensitive
    const ocorrencia = await manager
      .createQueryBuilder(Ocorrencia, 'ocorrencia')
      .where('LOWER(ocorrencia.descricao) = LOWER(:descricao)', { descricao: descricaoNormalizada })
      .getOne();

    if (ocorrencia) {
      return ocorrencia;
    }

    // Cria nova ocorrência
    const novaOcorrencia = manager.create(Ocorrencia, {
      descricao: descricaoNormalizada,
    });
    return await manager.save(Ocorrencia, novaOcorrencia);
  }

  /**
   * Verifica ou cria relacionamento leads_produto (usando manager da transação)
   */
  private async findOrCreateLeadsProduto(manager: any, leadId: number, produtoId: number): Promise<LeadsProduto> {
    const existing = await manager.findOne(LeadsProduto, {
      where: { leads_id: leadId, produto_id: produtoId },
    });

    if (existing) {
      return existing;
    }

    const novo = manager.create(LeadsProduto, {
      leads_id: leadId,
      produto_id: produtoId,
    });
    return await manager.save(LeadsProduto, novo);
  }

  /**
   * Sincroniza produtos de um lead
   * Remove produtos que não estão na lista e adiciona os novos
   */
  private async syncProdutos(leadId: number, produtoIds: number[]): Promise<void> {
    // Busca produtos atuais do lead
    const produtosAtuais = await this.leadsProdutoRepository.find({
      where: { leads_id: leadId },
    });

    const produtosAtuaisIds = produtosAtuais.map(p => p.produto_id);
    const produtosParaRemover = produtosAtuaisIds.filter(id => !produtoIds.includes(id));
    const produtosParaAdicionar = produtoIds.filter(id => !produtosAtuaisIds.includes(id));

    // Remove produtos que não estão mais na lista
    if (produtosParaRemover.length > 0) {
      for (const produtoId of produtosParaRemover) {
        await this.leadsProdutoRepository.delete({
          leads_id: leadId,
          produto_id: produtoId,
        });
      }
    }

    // Adiciona novos produtos
    if (produtosParaAdicionar.length > 0) {
      // Valida se os produtos existem
      const produtosExistentes = await this.produtoRepository.find({
        where: produtosParaAdicionar.map(id => ({ produto_id: id })),
      });

      const produtosExistentesIds = produtosExistentes.map(p => p.produto_id);
      const produtosInvalidos = produtosParaAdicionar.filter(id => !produtosExistentesIds.includes(id));

      if (produtosInvalidos.length > 0) {
        throw new BadRequestException(
          `Produtos não encontrados: ${produtosInvalidos.join(', ')}`
        );
      }

      // Cria relacionamentos
      const novosRelacionamentos = produtosParaAdicionar.map(produtoId =>
        this.leadsProdutoRepository.create({
          leads_id: leadId,
          produto_id: produtoId,
        })
      );

      await this.leadsProdutoRepository.save(novosRelacionamentos);
    }
  }

  /**
   * Parseia e valida data da ocorrência
   * Se inválida, retorna data atual
   */
  private parseOcorrenciaDate(dateString: string): Date {
    if (!dateString || !dateString.trim()) {
      return new Date();
    }

    const dateStr = dateString.trim();
    
    // Tenta formato yyyy-mm-dd
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

    // Tenta formato brasileiro dd/mm/yyyy
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

    // Tenta parsear como Date padrão
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // Se tudo falhar, retorna data atual
    return new Date();
  }

  /**
   * Processa coluna OCORRENCIA
   * Formato: "2025-07-24#COMPRA:GIR LEITEIRO,Fêmea(s)|2024-04-27#COMPRA:NÃO INFORMADA,Máquinas e Equipamentos"
   */
  private async processOcorrencias(manager: any, leadId: number, ocorrenciaString: string): Promise<void> {
    if (!ocorrenciaString || !ocorrenciaString.trim()) {
      return; // Ignora silenciosamente
    }

    const ocorrencias = ocorrenciaString.split('|').filter(o => o && o.trim());
    
    for (const ocorrenciaItem of ocorrencias) {
      if (!ocorrenciaItem.trim()) continue;

      // Split por #
      const parts = ocorrenciaItem.split('#');
      if (parts.length < 2) continue;

      const dataString = parts[0].trim();
      const resto = parts[1].trim();

      // Split por :
      const restoParts = resto.split(':');
      if (restoParts.length < 2) continue;

      const descricaoOcorrencia = restoParts[0].trim();
      const produtosString = restoParts.slice(1).join(':').trim(); // Pega tudo após o primeiro :

      if (!descricaoOcorrencia || !produtosString) continue;

      // Processa produtos: split por vírgula e concatena com espaço
      const produtosArray = produtosString.split(',').map(p => p.trim()).filter(p => p);
      const produtoFinal = produtosArray.join(' ');

      if (!produtoFinal) continue;

      // Busca/cria ocorrência
      const ocorrencia = await this.findOrCreateOcorrencia(manager, descricaoOcorrencia);

      // Busca/cria produto
      const produto = await this.findOrCreateProduto(manager, produtoFinal);

      // Parseia data (se inválida, usa data atual)
      const data = this.parseOcorrenciaDate(dataString);

      // Cria registro em lead_ocorrencia
      const leadOcorrencia = manager.create(LeadOcorrencia, {
        leads_id: leadId,
        ocorrencia_id: ocorrencia.ocorrencia_id,
        produto_id: produto.produto_id,
        data: data,
        active: true,
      });
      await manager.save(LeadOcorrencia, leadOcorrencia);

      // Verifica/cria relacionamento em leads_produto
      await this.findOrCreateLeadsProduto(manager, leadId, produto.produto_id);
    }
  }

  /**
   * Processa coluna TAGS
   * Formato: "[GIR LEITEIRO][Fêmea(s)][Máquinas e Equipamentos]"
   */
  private async processTags(manager: any, leadId: number, tagsString: string): Promise<void> {
    if (!tagsString || !tagsString.trim()) {
      return; // Ignora silenciosamente
    }

    // Extrai valores entre []
    const tagRegex = /\[([^\]]+)\]/g;
    const matches = tagsString.matchAll(tagRegex);
    const tags: string[] = [];

    for (const match of matches) {
      if (match[1] && match[1].trim()) {
        tags.push(match[1].trim());
      }
    }

    if (tags.length === 0) {
      return; // Ignora silenciosamente
    }

    // Para cada tag, busca/cria produto e relaciona com lead
    for (const tag of tags) {
      const produto = await this.findOrCreateProduto(manager, tag);
      await this.findOrCreateLeadsProduto(manager, leadId, produto.produto_id);
    }
  }

  /**
   * Processa coluna OCORRENCIA usando cache (versão otimizada)
   */
  private async processOcorrenciasWithCache(
    manager: any,
    leadId: number,
    ocorrenciaString: string,
    produtosCache: Map<string, Produto>,
    ocorrenciasCache: Map<string, Ocorrencia>
  ): Promise<void> {
    if (!ocorrenciaString || !ocorrenciaString.trim()) {
      return;
    }

    const ocorrencias = ocorrenciaString.split('|').filter(o => o && o.trim());
    
    for (const ocorrenciaItem of ocorrencias) {
      if (!ocorrenciaItem.trim()) continue;

      const parts = ocorrenciaItem.split('#');
      if (parts.length < 2) continue;

      const dataString = parts[0].trim();
      const resto = parts[1].trim();

      const restoParts = resto.split(':');
      if (restoParts.length < 2) continue;

      const descricaoOcorrencia = restoParts[0].trim();
      const produtosString = restoParts.slice(1).join(':').trim();

      if (!descricaoOcorrencia || !produtosString) continue;

      const produtosArray = produtosString.split(',').map(p => p.trim()).filter(p => p);
      const produtoFinal = produtosArray.join(' ');

      if (!produtoFinal) continue;

      // Usa cache para buscar ocorrência (já foi criada no pré-processamento se não existia)
      let ocorrencia = ocorrenciasCache.get(descricaoOcorrencia.toLowerCase());
      if (!ocorrencia) {
        // Fallback: se não está no cache, cria e adiciona ao cache
        ocorrencia = await this.findOrCreateOcorrencia(manager, descricaoOcorrencia);
        ocorrenciasCache.set(descricaoOcorrencia.toLowerCase(), ocorrencia);
      }

      // Usa cache para buscar produto (já foi criado no pré-processamento se não existia)
      let produto = produtosCache.get(produtoFinal.toLowerCase());
      if (!produto) {
        // Fallback: se não está no cache, cria e adiciona ao cache
        produto = await this.findOrCreateProduto(manager, produtoFinal);
        produtosCache.set(produtoFinal.toLowerCase(), produto);
      }

      const data = this.parseOcorrenciaDate(dataString);

      // Cria registro em lead_ocorrencia
      const leadOcorrencia = manager.create(LeadOcorrencia, {
        leads_id: leadId,
        ocorrencia_id: ocorrencia.ocorrencia_id,
        produto_id: produto.produto_id,
        data: data,
        active: true,
      });
      await manager.save(LeadOcorrencia, leadOcorrencia);

      // Verifica/cria relacionamento em leads_produto
      await this.findOrCreateLeadsProduto(manager, leadId, produto.produto_id);
    }
  }

  /**
   * Processa coluna TAGS usando cache (versão otimizada)
   */
  private async processTagsWithCache(
    manager: any,
    leadId: number,
    tagsString: string,
    produtosCache: Map<string, Produto>
  ): Promise<void> {
    if (!tagsString || !tagsString.trim()) {
      return;
    }

    const tagRegex = /\[([^\]]+)\]/g;
    const matches = tagsString.matchAll(tagRegex);
    const tags: string[] = [];

    for (const match of matches) {
      if (match[1] && match[1].trim()) {
        tags.push(match[1].trim());
      }
    }

    if (tags.length === 0) {
      return;
    }

    // Para cada tag, usa cache para buscar produto
    for (const tag of tags) {
      let produto = produtosCache.get(tag.toLowerCase());
      if (!produto) {
        // Fallback: se não está no cache, cria e adiciona ao cache
        produto = await this.findOrCreateProduto(manager, tag);
        produtosCache.set(tag.toLowerCase(), produto);
      }
      await this.findOrCreateLeadsProduto(manager, leadId, produto.produto_id);
    }
  }

  /**
   * Importa múltiplos leads de uma planilha
   * Processa em lotes de 100 leads por transação para otimizar performance
   * Regras:
   * - Admin pode importar para qualquer vendedor
   * - Agente só pode importar para si mesmo
   * - Se ID já existir ou não estiver preenchido, ignora o lead
   * - Apenas ID e LEAD são obrigatórios
   * - Processa OCORRENCIA e TAGS após criar o lead
   * @param leadsData Array de objetos com os dados dos leads (já filtrado por ID no controller)
   * @param currentUser Usuário atual realizando a importação
   */
  async importLeads(leadsData: any[], currentUser: User): Promise<{ success: number; error: any; idsIgnorados: number }> {
    let success = 0;
    let idsIgnorados = 0;
    const BATCH_SIZE = 100; // Processa 100 leads por transação

    // ============================================
    // PRÉ-PROCESSAMENTO: Buscar todos os dados necessários de uma vez
    // ============================================

    // 1. Extrai e valida todos os IDs
    const allLeadIds = leadsData
      .map((leadData, index) => {
        if (!leadData.id) return null;
        const idValue = typeof leadData.id === 'string' ? leadData.id.trim() : String(leadData.id).trim();
        if (idValue === '' || isNaN(Number(idValue))) return null;
        return parseInt(idValue, 10);
      })
      .filter((id): id is number => id !== null);

    // 2. Busca todos os IDs existentes em uma única query
    const existingIds = new Set<number>();
    if (allLeadIds.length > 0) {
      const existingLeads = await this.leadsRepository
        .createQueryBuilder('lead')
        .select('lead.id', 'id')
        .where('lead.id IN (:...ids)', { ids: allLeadIds })
        .getRawMany();
      existingLeads.forEach(lead => existingIds.add(lead.id));
    }

    // 3. Atualiza a sequência uma única vez antes de começar as inserções
    const idsToInsert = allLeadIds.filter(id => !existingIds.has(id));
    if (idsToInsert.length > 0) {
      const maxImportId = Math.max(...idsToInsert);
      const maxIdResult = await this.leadsRepository.query(
        `SELECT COALESCE(MAX(id), 0) as max_id FROM leads`
      );
      const maxId = parseInt(maxIdResult[0]?.max_id || '0', 10);
      
      if (maxImportId > maxId) {
        await this.leadsRepository.query(
          `SELECT setval('leads_id_seq', $1, false)`,
          [maxImportId]
        );
      }
    }

    // 4. Cache de vendedores: extrai todos os nomes únicos de vendedores
    const vendedorNomesUnicos = new Set<string>();
    const vendedorIdsUnicos = new Set<number>();
    leadsData.forEach(leadData => {
      const vendedorNome = leadData.vendedor?.trim();
      if (vendedorNome && vendedorNome !== '') {
        vendedorNomesUnicos.add(vendedorNome);
      }
      if (leadData.vendedor_id) {
        vendedorIdsUnicos.add(leadData.vendedor_id);
      }
    });

    // Busca todos os vendedores únicos de uma vez
    const vendedoresCache = new Map<string, User>();
    const vendedoresByIdCache = new Map<number, User>();
    
    if (vendedorNomesUnicos.size > 0) {
      const vendedoresNomes = Array.from(vendedorNomesUnicos);
      const vendedores = await this.usersRepository
        .createQueryBuilder('user')
        .where('user.nome IN (:...nomes)', { nomes: vendedoresNomes })
        .andWhere('user.perfil = :perfil', { perfil: UserProfile.AGENTE })
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

    // 5. Extrai todos os produtos e ocorrências únicos da planilha
    const produtosUnicos = new Set<string>();
    const ocorrenciasUnicas = new Set<string>();

    leadsData.forEach(leadData => {
      // Extrai produtos de OCORRENCIA
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

      // Extrai produtos de TAGS
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

    // 6. Busca produtos e ocorrências existentes de uma vez e cria os que não existem
    const produtosCache = new Map<string, Produto>();
    const ocorrenciasCache = new Map<string, Ocorrencia>();

    // Busca produtos existentes
    if (produtosUnicos.size > 0) {
      const produtosExistentes = await this.produtoRepository
        .createQueryBuilder('produto')
        .where('LOWER(produto.descricao) IN (:...descricoes)', {
          descricoes: Array.from(produtosUnicos).map(p => p.toLowerCase()),
        })
        .getMany();
      produtosExistentes.forEach(p => {
        produtosCache.set(p.descricao.toLowerCase(), p);
      });

      // Cria produtos que não existem (em uma única transação)
      const produtosParaCriar = Array.from(produtosUnicos).filter(
        p => !produtosCache.has(p.toLowerCase())
      );
      
      if (produtosParaCriar.length > 0) {
        const novosProdutos = produtosParaCriar.map(descricao => 
          this.produtoRepository.create({ descricao: descricao.trim() })
        );
        const produtosCriados = await this.produtoRepository.save(novosProdutos);
        produtosCriados.forEach(p => {
          produtosCache.set(p.descricao.toLowerCase(), p);
        });
      }
    }

    // Busca ocorrências existentes
    if (ocorrenciasUnicas.size > 0) {
      const ocorrenciasExistentes = await this.ocorrenciaRepository
        .createQueryBuilder('ocorrencia')
        .where('LOWER(ocorrencia.descricao) IN (:...descricoes)', {
          descricoes: Array.from(ocorrenciasUnicas).map(o => o.toLowerCase()),
        })
        .getMany();
      ocorrenciasExistentes.forEach(o => {
        ocorrenciasCache.set(o.descricao.toLowerCase(), o);
      });

      // Cria ocorrências que não existem (em uma única transação)
      const ocorrenciasParaCriar = Array.from(ocorrenciasUnicas).filter(
        o => !ocorrenciasCache.has(o.toLowerCase())
      );
      
      if (ocorrenciasParaCriar.length > 0) {
        const novasOcorrencias = ocorrenciasParaCriar.map(descricao => 
          this.ocorrenciaRepository.create({ descricao: descricao.trim() })
        );
        const ocorrenciasCriadas = await this.ocorrenciaRepository.save(novasOcorrencias);
        ocorrenciasCriadas.forEach(o => {
          ocorrenciasCache.set(o.descricao.toLowerCase(), o);
        });
      }
    }

    // ============================================
    // PROCESSAMENTO EM LOTES: 100 leads por transação
    // ============================================
    
    // Processa em lotes para reduzir overhead de transações
    for (let batchStart = 0; batchStart < leadsData.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, leadsData.length);
      const batch = leadsData.slice(batchStart, batchEnd);
      
      // Uma transação para todo o lote
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Processa cada lead do lote
        for (let batchIndex = 0; batchIndex < batch.length; batchIndex++) {
          const leadData = batch[batchIndex];
          // Calcula linha para mensagens de erro (linha 1 é cabeçalho, então index + 2)
          const linha = batchStart + batchIndex + 2;
          
          // Validação: Se ID não estiver preenchido, para a importação
          let leadId: number;
          
          if (!leadData.id) {
            await queryRunner.rollbackTransaction();
            const error = new BadRequestException({
              linha,
              id: '',
              erro: 'ID não preenchido. Campo ID é obrigatório e deve ser um número.',
              linhasImportadas: success,
            });
            (error as any).success = success;
            throw error;
          }

          // Tenta converter para número
          const idValue = typeof leadData.id === 'string' ? leadData.id.trim() : String(leadData.id).trim();
          
          if (idValue === '' || isNaN(Number(idValue))) {
            await queryRunner.rollbackTransaction();
            const error = new BadRequestException({
              linha,
              id: idValue,
              erro: 'ID deve ser um número válido',
              linhasImportadas: success,
            });
            (error as any).success = success;
            throw error;
          }

          leadId = parseInt(idValue, 10);

          // Validação: Se ID já existir, ignora e continua
          if (existingIds.has(leadId)) {
            idsIgnorados++;
            continue;
          }

          // Busca vendedor usando cache
          let vendedor: User | null = null;
          const vendedorNome = leadData.vendedor?.trim();
          
          if (vendedorNome && vendedorNome !== '') {
            // Usa cache em vez de query
            vendedor = vendedoresCache.get(vendedorNome.toLowerCase());
            
            if (!vendedor) {
              await queryRunner.rollbackTransaction();
              const error = new BadRequestException({
                linha,
                id: String(leadId),
                erro: `Vendedor "${vendedorNome}" não encontrado`,
                linhasImportadas: success,
              });
              (error as any).success = success;
              throw error;
            }
          } else if (leadData.vendedor_id) {
            // Usa cache por ID
            vendedor = vendedoresByIdCache.get(leadData.vendedor_id);
          }

          // Se o usuário é Agente, força o vendedor_id para ser ele mesmo
          if (currentUser.perfil === UserProfile.AGENTE) {
            vendedor = currentUser;
          }

          // Valida perfil do vendedor
          if (vendedor && vendedor.perfil !== UserProfile.AGENTE) {
            await queryRunner.rollbackTransaction();
            const error = new BadRequestException({
              linha,
              id: String(leadId),
              erro: 'Vendedor deve ser um Agente',
              linhasImportadas: success,
            });
            (error as any).success = success;
            throw error;
          }

          // Prepara dados do lead
          const leadToSave: any = {
            id: leadId,
            nome_razao_social: leadData.nome_razao_social.trim(),
            vendedor_id: vendedor ? vendedor.id : null,
            data_entrada: leadData.data_entrada ? new Date(leadData.data_entrada) : new Date(),
          };

          // Campos opcionais
          if (leadData.telefone) leadToSave.telefone = leadData.telefone.trim();
          if (leadData.email) leadToSave.email = leadData.email.trim();
          if (leadData.anotacoes) leadToSave.anotacoes = leadData.anotacoes.trim();
          if (leadData.nome_fantasia_apelido) leadToSave.nome_fantasia_apelido = leadData.nome_fantasia_apelido.trim();
          
          if (leadData.uf && leadData.uf.trim()) {
            leadToSave.uf = leadData.uf.trim().substring(0, 2).toUpperCase();
          }
          
          if (leadData.municipio && leadData.municipio.trim()) {
            leadToSave.municipio = leadData.municipio.trim();
          }
          
          if (leadData.origem_lead) {
            leadToSave.origem_lead = leadData.origem_lead;
          }

          // Total Conversões
          if (leadData.total_conversoes !== undefined && leadData.total_conversoes !== null) {
            const totalConversoesStr = String(leadData.total_conversoes).trim();
            if (totalConversoesStr !== '') {
              const totalConversoesNum = Number(totalConversoesStr);
              if (!isNaN(totalConversoesNum) && isFinite(totalConversoesNum)) {
                leadToSave.total_conversoes = Math.floor(totalConversoesNum);
              } else {
                const parsedInt = parseInt(totalConversoesStr, 10);
                if (!isNaN(parsedInt)) {
                  leadToSave.total_conversoes = parsedInt;
                }
              }
            }
          }

          // Insere o lead com ID específico da planilha
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
          
          // Executa o INSERT com ID explícito
          await queryRunner.manager.query(
            `INSERT INTO leads (${columnsStr}) VALUES (${placeholdersStr})`,
            values
          );
          
          const savedLeadId = leadId;
          
          // Processa OCORRENCIA usando cache
          if (leadData.ocorrencia) {
            await this.processOcorrenciasWithCache(
              queryRunner.manager,
              savedLeadId,
              leadData.ocorrencia,
              produtosCache,
              ocorrenciasCache
            );
          }

          // Processa TAGS usando cache
          if (leadData.tags) {
            await this.processTagsWithCache(
              queryRunner.manager,
              savedLeadId,
              leadData.tags,
              produtosCache
            );
          }

          success++;
        }

        // Commit do lote inteiro
        await queryRunner.commitTransaction();
      } catch (error) {
        // Rollback em caso de erro
        await queryRunner.rollbackTransaction();
        
        // Se já é BadRequestException, propaga
        if (error instanceof BadRequestException) {
          throw error;
        }
        
        // Calcula linha do erro (linha 1 é cabeçalho, então index + 2)
        const erroIndex = batchStart;
        const erroLinha = erroIndex + 2;
        const erroLeadData = leadsData[erroIndex];
        const erroLeadId = erroLeadData?.id ? String(erroLeadData.id) : 'N/A';
        
        const errorWithSuccess = new BadRequestException({
          linha: erroLinha,
          id: erroLeadId,
          erro: error.message || 'Erro ao processar lead e suas ocorrências/tags',
          linhasImportadas: success,
        });
        (errorWithSuccess as any).success = success;
        throw errorWithSuccess;
      } finally {
        // Libera a conexão
        await queryRunner.release();
      }
    }

    return { success, error: null, idsIgnorados };
  }
}

