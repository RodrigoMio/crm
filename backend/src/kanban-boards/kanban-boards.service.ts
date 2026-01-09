import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { KanbanBoard, KanbanBoardType } from './entities/kanban-board.entity';
import { CreateKanbanBoardDto } from './dto/create-kanban-board.dto';
import { UpdateKanbanBoardDto } from './dto/update-kanban-board.dto';
import { FilterKanbanBoardsDto } from './dto/filter-kanban-boards.dto';
import { FilterLeadsDto } from '../leads/dto/filter-leads.dto';
import { Lead } from '../leads/entities/lead.entity';
import { User, UserProfile } from '../users/entities/user.entity';
import { KanbanModelo } from '../kanban-modelos/entities/kanban-modelo.entity';
import { KanbanModeloStatus } from '../kanban-modelos/entities/kanban-modelo-status.entity';
import { KanbanStatus } from '../kanban-modelos/entities/kanban-status.entity';
import { Occurrence, OccurrenceType } from '../occurrences/entities/occurrence.entity';
import { OccurrencesService } from '../occurrences/occurrences.service';
import { LeadsProduto } from '../leads-produtos/entities/leads-produto.entity';

export interface BoardWithLeadsCount {
  id: number;
  nome: string;
  cor_hex: string;
  usuario_id_dono: number | null;
  agente_id: number | null;
  colaborador_id: number | null;
  kanban_modelo_id: number | null;
  ordem: number;
  tipo: KanbanBoardType;
  kanban_status_id: number | null;
  id_usuario_created_at: number;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  leads_count: number;
}

@Injectable()
export class KanbanBoardsService {
  constructor(
    @InjectRepository(KanbanBoard)
    private kanbanBoardRepository: Repository<KanbanBoard>,
    @InjectRepository(Lead)
    private leadsRepository: Repository<Lead>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(KanbanModelo)
    private kanbanModeloRepository: Repository<KanbanModelo>,
    @InjectRepository(KanbanModeloStatus)
    private kanbanModeloStatusRepository: Repository<KanbanModeloStatus>,
    @InjectRepository(KanbanStatus)
    private kanbanStatusRepository: Repository<KanbanStatus>,
    @InjectRepository(Occurrence)
    private occurrencesRepository: Repository<Occurrence>,
    @InjectRepository(LeadsProduto)
    private leadsProdutoRepository: Repository<LeadsProduto>,
  ) {}

  /**
   * Normaliza ID para number
   */
  private normalizeId(id: any): number {
    if (typeof id === 'string') {
      return parseInt(id, 10);
    }
    return Number(id);
  }

  /**
   * Cria ou retorna o board "Novos" dinamicamente
   * Módulo 1 (Admin): usuario_id_dono = admin logado
   * Módulo 2 (Agente): usuario_id_dono = agente logado (ou agente selecionado se admin)
   * Módulo 3 (Colaborador): usuario_id_dono = colaborador logado (ou colaborador selecionado)
   */
  async ensureNovosBoard(
    tipo: KanbanBoardType,
    currentUser: User,
    agenteId?: number,
    colaboradorId?: number,
  ): Promise<KanbanBoard> {
    let usuarioIdDono: number;
    let agenteIdForBoard: number | null = null;
    let colaboradorIdForBoard: number | null = null;

    if (tipo === KanbanBoardType.ADMIN) {
      // Módulo 1: Admin vê board "Novos" próprio
      usuarioIdDono = this.normalizeId(currentUser.id);
    } else if (tipo === KanbanBoardType.AGENTE) {
      // Módulo 2: Se admin filtrando, usa agente selecionado; senão usa agente logado
      if (currentUser.perfil === UserProfile.ADMIN && agenteId) {
        usuarioIdDono = agenteId;
        agenteIdForBoard = agenteId;
      } else {
        usuarioIdDono = this.normalizeId(currentUser.id);
        agenteIdForBoard = this.normalizeId(currentUser.id);
      }
    } else if (tipo === KanbanBoardType.COLABORADOR) {
      // Módulo 3: Se admin/agente filtrando, usa colaborador selecionado; senão usa colaborador logado
      if (colaboradorId) {
        usuarioIdDono = colaboradorId;
        colaboradorIdForBoard = colaboradorId;
      } else {
        usuarioIdDono = this.normalizeId(currentUser.id);
        colaboradorIdForBoard = this.normalizeId(currentUser.id);
      }
    } else {
      throw new BadRequestException('Tipo de board inválido');
    }

    // Verifica se já existe board "Novos" para esse contexto
    const existingNovos = await this.kanbanBoardRepository.findOne({
      where: {
        nome: 'NOVOS',
        tipo,
        usuario_id_dono: usuarioIdDono,
        active: true,
      },
    });

    if (existingNovos) {
      return existingNovos;
    }

    // Cria board "Novos" dinamicamente
    const novosBoard = this.kanbanBoardRepository.create({
      nome: 'NOVOS',
      cor_hex: '#C6DCFF',
      usuario_id_dono: usuarioIdDono,
      agente_id: agenteIdForBoard,
      colaborador_id: colaboradorIdForBoard,
      kanban_modelo_id: null,
      ordem: 0,
      tipo,
      kanban_status_id: null,
      id_usuario_created_at: this.normalizeId(currentUser.id),
      active: true,
    });

    return await this.kanbanBoardRepository.save(novosBoard);
  }

  /**
   * Lista boards com contagem de leads
   */
  async findAll(
    filterDto: FilterKanbanBoardsDto,
    currentUser: User,
  ): Promise<BoardWithLeadsCount[]> {
    const queryBuilder = this.kanbanBoardRepository
      .createQueryBuilder('board')
      .where('board.active = :active', { active: true });

    // Filtros
    if (filterDto.tipo) {
      queryBuilder.andWhere('board.tipo = :tipo', { tipo: filterDto.tipo });
    }

    if (filterDto.agente_id) {
      queryBuilder.andWhere('board.agente_id = :agente_id', {
        agente_id: filterDto.agente_id,
      });
    }

    if (filterDto.colaborador_id) {
      queryBuilder.andWhere('board.colaborador_id = :colaborador_id', {
        colaborador_id: filterDto.colaborador_id,
      });
    }

    if (filterDto.usuario_id_dono) {
      queryBuilder.andWhere('board.usuario_id_dono = :usuario_id_dono', {
        usuario_id_dono: filterDto.usuario_id_dono,
      });
    }

    if (filterDto.nome) {
      queryBuilder.andWhere('board.nome ILIKE :nome', {
        nome: `%${filterDto.nome}%`,
      });
    }

    // Ordenação
    queryBuilder.orderBy('board.ordem', 'ASC');

    // Carrega relação com kanbanStatus para ter acesso às cores
    queryBuilder.leftJoinAndSelect('board.kanbanStatus', 'kanbanStatus');

    const boards = await queryBuilder.getMany();

    // Adiciona contagem de leads para cada board e ajusta cor se necessário
    const boardsWithCounts = await Promise.all(
      boards.map(async (board) => {
        const count = await this.getLeadsCountByBoard(board);
        
        // Se for board do tipo COLABORADOR e tiver kanban_status_id, usa a cor do status
        let corFinal = board.cor_hex;
        if (board.tipo === KanbanBoardType.COLABORADOR && board.kanbanStatus?.bg_color) {
          corFinal = board.kanbanStatus.bg_color;
        }
        
        return {
          ...board,
          cor_hex: corFinal, // Sobrescreve com a cor do status se disponível
          leads_count: count,
        };
      }),
    );

    return boardsWithCounts;
  }

  /**
   * Busca um board por ID
   */
  async findOne(id: number): Promise<KanbanBoard> {
    const board = await this.kanbanBoardRepository.findOne({
      where: { id },
    });

    if (!board) {
      throw new NotFoundException('Board não encontrado');
    }

    return board;
  }

  /**
   * Cria um novo board
   * Se for módulo 2 (tipo AGENTE) com colaborador_id, cria automaticamente boards no módulo 3
   */
  async create(
    createKanbanBoardDto: CreateKanbanBoardDto,
    currentUser: User,
  ): Promise<KanbanBoard> {
    // Validações
    if (createKanbanBoardDto.tipo === KanbanBoardType.AGENTE) {
      if (!createKanbanBoardDto.colaborador_id) {
        throw new BadRequestException(
          'colaborador_id é obrigatório para boards do tipo AGENTE',
        );
      }
      if (!createKanbanBoardDto.kanban_modelo_id) {
        throw new BadRequestException(
          'kanban_modelo_id é obrigatório para boards do tipo AGENTE',
        );
      }

      // Se agente_id não foi fornecido, determina automaticamente
      let agenteId = createKanbanBoardDto.agente_id;
      if (!agenteId) {
        // Se Admin está criando, precisa ter agente_id no DTO
        // Se Agente está criando, usa o próprio ID
        if (currentUser.perfil === UserProfile.AGENTE) {
          agenteId = this.normalizeId(currentUser.id);
        } else {
          throw new BadRequestException(
            'agente_id é obrigatório para boards do tipo AGENTE',
          );
        }
      }

      // Verifica se colaborador já tem board (apenas 1 permitido)
      const existingBoard = await this.kanbanBoardRepository.findOne({
        where: {
          colaborador_id: createKanbanBoardDto.colaborador_id,
          tipo: KanbanBoardType.AGENTE,
          active: true,
        },
      });

      if (existingBoard) {
        throw new BadRequestException(
          'Colaborador já possui um board. Cada colaborador pode ter apenas 1 board.',
        );
      }

      // Garante que usuario_id_dono seja o agente_id
      const boardData = {
        ...createKanbanBoardDto,
        agente_id: agenteId,
        usuario_id_dono: agenteId, // Board do módulo AGENTE pertence ao agente
        id_usuario_created_at: this.normalizeId(currentUser.id),
        ordem: createKanbanBoardDto.ordem ?? 0,
      };

      const board = this.kanbanBoardRepository.create(boardData);
      const savedBoard = await this.kanbanBoardRepository.save(board);

      // Se for módulo 2 com colaborador, cria boards automáticos no módulo 3
      if (
        savedBoard.tipo === KanbanBoardType.AGENTE &&
        savedBoard.colaborador_id &&
        savedBoard.kanban_modelo_id
      ) {
        await this.createAutomaticBoardsForColaborador(savedBoard);
      }

      return savedBoard;
    }

    // Para outros tipos de board, cria normalmente
    const board = this.kanbanBoardRepository.create({
      ...createKanbanBoardDto,
      id_usuario_created_at: this.normalizeId(currentUser.id),
      ordem: createKanbanBoardDto.ordem ?? 0,
    });

    const savedBoard = await this.kanbanBoardRepository.save(board);

    // Se for módulo 2 com colaborador, cria boards automáticos no módulo 3
    if (
      savedBoard.tipo === KanbanBoardType.AGENTE &&
      savedBoard.colaborador_id &&
      savedBoard.kanban_modelo_id
    ) {
      await this.createAutomaticBoardsForColaborador(savedBoard);
    }

    return savedBoard;
  }

  /**
   * Cria boards automáticos no módulo 3 baseados nos status do modelo
   */
  private async createAutomaticBoardsForColaborador(
    boardAgente: KanbanBoard,
  ): Promise<void> {
    // Busca status vinculados ao modelo
    const modeloStatuses = await this.kanbanModeloStatusRepository.find({
      where: { kanban_modelo_id: boardAgente.kanban_modelo_id },
      relations: ['kanbanStatus'],
    });

    // Cria um board para cada status
    let ordem = 1;
    for (const modeloStatus of modeloStatuses) {
      if (modeloStatus.kanbanStatus && modeloStatus.kanbanStatus.active) {
        const statusBoard = this.kanbanBoardRepository.create({
          nome: modeloStatus.kanbanStatus.descricao,
          cor_hex: modeloStatus.kanbanStatus.bg_color || boardAgente.cor_hex, // Usa a cor do status, fallback para cor do board do módulo 2
          usuario_id_dono: boardAgente.colaborador_id,
          colaborador_id: boardAgente.colaborador_id,
          kanban_modelo_id: boardAgente.kanban_modelo_id,
          ordem: ordem++,
          tipo: KanbanBoardType.COLABORADOR,
          kanban_status_id: modeloStatus.kanbanStatus.kanban_status_id,
          id_usuario_created_at: boardAgente.id_usuario_created_at,
          active: true,
        });

        await this.kanbanBoardRepository.save(statusBoard);
      }
    }
  }

  /**
   * Atualiza um board
   */
  async update(
    id: number,
    updateKanbanBoardDto: UpdateKanbanBoardDto,
    currentUser: User,
  ): Promise<KanbanBoard> {
    const board = await this.findOne(id);

    Object.assign(board, updateKanbanBoardDto);
    return await this.kanbanBoardRepository.save(board);
  }

  /**
   * Remove um board (apenas se estiver vazio)
   */
  async remove(id: number, currentUser: User): Promise<void> {
    const board = await this.findOne(id);

    // Verifica se tem leads
    const count = await this.getLeadsCountByBoard(board);
    if (count > 0) {
      throw new BadRequestException(
        'Não é possível excluir um board que contém leads',
      );
    }

    // Soft delete
    board.active = false;
    await this.kanbanBoardRepository.save(board);
  }

  /**
   * Move um lead de um board para outro
   */
  async moveLead(
    leadId: number,
    fromBoardId: number,
    toBoardId: number,
    currentUser: User,
  ): Promise<Lead> {
    const lead = await this.leadsRepository.findOne({
      where: { id: leadId },
    });

    if (!lead) {
      throw new NotFoundException('Lead não encontrado');
    }

    const fromBoard = await this.findOne(fromBoardId);
    const toBoard = await this.findOne(toBoardId);

    // Atualiza lead conforme o tipo de board de destino
    if (toBoard.tipo === KanbanBoardType.ADMIN) {
      if (toBoard.nome === 'NOVOS') {
        // Kanban-Admin: Agente → NOVO
        lead.vendedor_id = null;
        lead.usuario_id_colaborador = null;
        lead.kanban_status_id = null;
      } else {
        // Kanban-Admin: NOVO → Agente ou Agente → Agente
        lead.vendedor_id = toBoard.agente_id;
        lead.usuario_id_colaborador = null;
        lead.kanban_status_id = null;
      }
    } else if (toBoard.tipo === KanbanBoardType.AGENTE) {
      if (toBoard.nome === 'NOVOS') {
        // Kanban-Agente: Colaborador → NOVO
        lead.usuario_id_colaborador = null;
        lead.kanban_status_id = null;
      } else {
        // Kanban-Agente: NOVO → Colaborador ou Colaborador → Colaborador
        lead.usuario_id_colaborador = toBoard.colaborador_id;
        lead.kanban_status_id = null;
      }
    } else if (toBoard.tipo === KanbanBoardType.COLABORADOR) {
      if (toBoard.nome === 'NOVOS') {
        // Kanban-Colaborador: Status → NOVO
        lead.kanban_status_id = null;
      } else {
        // Kanban-Colaborador: NOVO → Status ou Status → Status
        lead.kanban_status_id = toBoard.kanban_status_id;
      }
    }

    await this.leadsRepository.save(lead);

    // Cria log de movimentação
    const logText = `Board: ${fromBoard.nome} -> Board: ${toBoard.nome}`;
    await this.createSystemOccurrence(leadId, logText, currentUser);

    return lead;
  }

  /**
   * Cria ocorrência do tipo SISTEMA
   */
  private async createSystemOccurrence(
    leadId: number,
    texto: string,
    currentUser: User,
  ): Promise<Occurrence> {
    const userId = this.normalizeId(currentUser.id);

    const occurrence = this.occurrencesRepository.create({
      leads_id: leadId,
      usuarios_id: userId,
      texto,
      tipo: OccurrenceType.SISTEMA,
    });

    return await this.occurrencesRepository.save(occurrence);
  }

  /**
   * Busca leads de um board com paginação e filtros
   */
  async getLeadsByBoard(
    boardId: number,
    filterDto: FilterLeadsDto,
    currentUser: User,
  ): Promise<{ data: Lead[]; total: number; page: number; limit: number }> {
    const board = await this.findOne(boardId);
    const page = filterDto.page || 1;
    const limit = filterDto.limit || 50;

    const queryBuilder = this.leadsRepository.createQueryBuilder('lead');

    // Aplica filtros conforme o tipo de board
    if (board.tipo === KanbanBoardType.ADMIN) {
      if (board.nome === 'NOVOS') {
        queryBuilder.where('lead.vendedor_id IS NULL');
      } else {
        queryBuilder.where('lead.vendedor_id = :agente_id', {
          agente_id: board.agente_id,
        });
      }
    } else if (board.tipo === KanbanBoardType.AGENTE) {
      if (board.nome === 'NOVOS') {
        queryBuilder.where('lead.vendedor_id = :agente_id', {
          agente_id: board.agente_id,
        });
        queryBuilder.andWhere('lead.usuario_id_colaborador IS NULL');
      } else {
        queryBuilder.where('lead.usuario_id_colaborador = :colaborador_id', {
          colaborador_id: board.colaborador_id,
        });
      }
    } else if (board.tipo === KanbanBoardType.COLABORADOR) {
      if (board.nome === 'NOVOS') {
        queryBuilder.where('lead.usuario_id_colaborador = :colaborador_id', {
          colaborador_id: board.colaborador_id,
        });
        queryBuilder.andWhere('lead.kanban_status_id IS NULL');
      } else {
        queryBuilder.where('lead.kanban_status_id = :kanban_status_id', {
          kanban_status_id: board.kanban_status_id,
        });
        queryBuilder.andWhere('lead.usuario_id_colaborador = :colaborador_id', {
          colaborador_id: board.colaborador_id,
        });
      }
    }

    // Filtro por nome/razão social (busca parcial, case-insensitive e sem acentos)
    // Normaliza acentos para buscar "Jose" e encontrar "José", "João" e encontrar "Joao"
    if (filterDto.nome_razao_social) {
      const fromChars = 'áàâãäéèêëíìîïóòôõöúùûüçñýÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑÝ';
      const toChars = 'aaaaaeeeeiiiiooooouuuucnyAAAAAEEEEIIIIOOOOOUUUUCNY';
      
      queryBuilder.andWhere(
        `(
          translate(LOWER(lead.nome_razao_social), :fromChars, :toChars) ILIKE translate(LOWER(:nome), :fromChars, :toChars)
          OR 
          translate(LOWER(lead.nome_fantasia_apelido), :fromChars, :toChars) ILIKE translate(LOWER(:nome), :fromChars, :toChars)
        )`,
        { 
          nome: `%${filterDto.nome_razao_social.trim()}%`,
          fromChars,
          toChars
        }
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
        const colaboradorPaiId = colaborador?.usuario_id_pai ? this.normalizeId(colaborador.usuario_id_pai) : null;
        if (!colaborador || colaboradorPaiId !== currentUserId) {
          throw new ForbiddenException('Agente só pode filtrar por seus próprios colaboradores');
        }
      }
      // Colaborador só pode ver seus próprios leads
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

    // Carrega relações necessárias para Kanban
    queryBuilder.leftJoinAndSelect('lead.colaborador', 'colaborador');
    queryBuilder.leftJoinAndSelect('lead.kanbanStatus', 'kanbanStatus');

    // Ordenação
    queryBuilder.orderBy('lead.created_at', 'DESC');

    // Contagem total antes da paginação
    const total = await queryBuilder.getCount();

    // Paginação
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const data = await queryBuilder.getMany();

    // Carrega produtos para todos os leads de uma vez
    if (data.length > 0) {
      const leadIds = data.map(lead => lead.id);
      const leadsProdutos = await this.leadsProdutoRepository.find({
        where: { leads_id: In(leadIds) },
        relations: ['produto'],
      });

      // Agrupa produtos por lead_id, evitando duplicatas
      const produtosPorLead = new Map<number, Map<number, any>>();
      leadsProdutos.forEach(lp => {
        if (!produtosPorLead.has(lp.leads_id)) {
          produtosPorLead.set(lp.leads_id, new Map());
        }
        const produtosMap = produtosPorLead.get(lp.leads_id)!;
        // Usa produto_id como chave para evitar duplicatas
        if (!produtosMap.has(lp.produto.produto_id)) {
          produtosMap.set(lp.produto.produto_id, lp.produto);
        }
      });

      // Adiciona produtos a cada lead (converte Map para Array)
      data.forEach(lead => {
        const produtosMap = produtosPorLead.get(lead.id);
        (lead as any).produtos = produtosMap ? Array.from(produtosMap.values()) : [];
      });
    }

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Retorna contagem de leads de um board
   */
  private async getLeadsCountByBoard(board: KanbanBoard): Promise<number> {
    const queryBuilder = this.leadsRepository.createQueryBuilder('lead');

    if (board.tipo === KanbanBoardType.ADMIN) {
      if (board.nome === 'NOVOS') {
        queryBuilder.where('lead.vendedor_id IS NULL');
      } else {
        queryBuilder.where('lead.vendedor_id = :agente_id', {
          agente_id: board.agente_id,
        });
      }
    } else if (board.tipo === KanbanBoardType.AGENTE) {
      if (board.nome === 'NOVOS') {
        queryBuilder.where('lead.vendedor_id = :agente_id', {
          agente_id: board.agente_id,
        });
        queryBuilder.andWhere('lead.usuario_id_colaborador IS NULL');
      } else {
        queryBuilder.where('lead.usuario_id_colaborador = :colaborador_id', {
          colaborador_id: board.colaborador_id,
        });
      }
    } else if (board.tipo === KanbanBoardType.COLABORADOR) {
      if (board.nome === 'NOVOS') {
        queryBuilder.where('lead.usuario_id_colaborador = :colaborador_id', {
          colaborador_id: board.colaborador_id,
        });
        queryBuilder.andWhere('lead.kanban_status_id IS NULL');
      } else {
        queryBuilder.where('lead.kanban_status_id = :kanban_status_id', {
          kanban_status_id: board.kanban_status_id,
        });
        queryBuilder.andWhere('lead.usuario_id_colaborador = :colaborador_id', {
          colaborador_id: board.colaborador_id,
        });
      }
    }

    return await queryBuilder.getCount();
  }

  /**
   * Atualiza ordem dos boards
   */
  async updateOrder(
    boardIds: number[],
    tipo: KanbanBoardType,
  ): Promise<KanbanBoard[]> {
    const boards = await this.kanbanBoardRepository.find({
      where: { id: In(boardIds), tipo, active: true },
    });

    // Atualiza ordem conforme a sequência recebida
    for (let i = 0; i < boardIds.length; i++) {
      const board = boards.find((b) => b.id === boardIds[i]);
      if (board) {
        board.ordem = i;
      }
    }

    return await this.kanbanBoardRepository.save(boards);
  }
}

