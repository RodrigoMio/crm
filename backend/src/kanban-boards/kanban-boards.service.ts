import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { KanbanBoard, KanbanBoardType } from './entities/kanban-board.entity';
import { CreateKanbanBoardDto } from './dto/create-kanban-board.dto';
import { UpdateKanbanBoardDto } from './dto/update-kanban-board.dto';
import { FilterKanbanBoardsDto } from './dto/filter-kanban-boards.dto';
import { FilterLeadsDto } from '../leads/dto/filter-leads.dto';
import { CreateLeadDto } from '../leads/dto/create-lead.dto';
import { Lead } from '../leads/entities/lead.entity';
import { User, UserProfile } from '../users/entities/user.entity';
import { KanbanModelo } from '../kanban-modelos/entities/kanban-modelo.entity';
import { KanbanModeloStatus } from '../kanban-modelos/entities/kanban-modelo-status.entity';
import { KanbanStatus } from '../kanban-modelos/entities/kanban-status.entity';
import { Occurrence, OccurrenceType } from '../occurrences/entities/occurrence.entity';
import { OccurrencesService } from '../occurrences/occurrences.service';
import { LeadsProduto } from '../leads-produtos/entities/leads-produto.entity';
import { Produto } from '../produtos/entities/produto.entity';

// Enum TipoFluxo (temporário até encontrar a entidade)
export enum TipoFluxo {
  COMPRADOR = 'COMPRADOR',
  VENDEDOR = 'VENDEDOR',
}

// Interface temporária para LeadKanbanStatus até encontrar a entidade
interface LeadKanbanStatus {
  id: number;
  lead_id: number;
  kanban_status_id: number | null;
  tipo_fluxo: TipoFluxo;
  vendedor_id: number | null;
  usuario_id_colaborador: number | null;
  usuarios_id: number | null;
  created_at: Date;
  updated_at: Date;
}

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
  tipo_fluxo?: 'COMPRADOR' | 'VENDEDOR' | null;
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
    @InjectRepository(Produto)
    private produtoRepository: Repository<Produto>,
    private dataSource: DataSource,
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
   */
  async ensureNovosBoard(
    tipo: KanbanBoardType,
    currentUser: User,
    agenteId?: number,
    colaboradorId?: number,
    tipoFluxo?: 'COMPRADOR' | 'VENDEDOR',
  ): Promise<KanbanBoard> {
    let usuarioIdDono: number;
    let agenteIdForBoard: number | null = null;
    let colaboradorIdForBoard: number | null = null;

    if (tipo === KanbanBoardType.ADMIN) {
      usuarioIdDono = this.normalizeId(currentUser.id);
    } else if (tipo === KanbanBoardType.AGENTE) {
      if (currentUser.perfil === UserProfile.ADMIN && agenteId) {
        usuarioIdDono = agenteId;
        agenteIdForBoard = agenteId;
      } else {
        usuarioIdDono = this.normalizeId(currentUser.id);
        agenteIdForBoard = this.normalizeId(currentUser.id);
      }
    } else if (tipo === KanbanBoardType.COLABORADOR) {
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

    // Se tipo_fluxo não foi informado, usa COMPRADOR como padrão
    const tipoFluxoFinal = tipoFluxo || 'COMPRADOR';

    const existingNovos = await this.kanbanBoardRepository.findOne({
      where: {
        nome: 'NOVOS',
        tipo,
        usuario_id_dono: usuarioIdDono,
        tipo_fluxo: tipoFluxoFinal,
        active: true,
      },
    });

    if (existingNovos) {
      return existingNovos;
    }

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
      tipo_fluxo: tipoFluxoFinal,
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

    if (filterDto.tipo_fluxo) {
      queryBuilder.leftJoin('kanban_modelo', 'modelo', 'modelo.kanban_modelo_id = board.kanban_modelo_id');
      
      if (filterDto.tipo_fluxo === 'COMPRADOR') {
        queryBuilder.andWhere(
          `(
            board.tipo_fluxo = :tipo_fluxo 
            OR board.tipo_fluxo IS NULL
            OR modelo.tipo_fluxo = :tipo_fluxo
          )`,
          { tipo_fluxo: filterDto.tipo_fluxo }
        );
      } else {
        queryBuilder.andWhere(
          `(
            board.tipo_fluxo = :tipo_fluxo 
            OR modelo.tipo_fluxo = :tipo_fluxo
          )`,
          { tipo_fluxo: filterDto.tipo_fluxo }
        );
      }
    }

    queryBuilder.orderBy('board.ordem', 'ASC');
    queryBuilder.leftJoinAndSelect('board.kanbanStatus', 'kanbanStatus');

    const boards = await queryBuilder.getMany();

    const boardsWithCounts = await Promise.all(
      boards.map(async (board) => {
        const count = await this.getLeadsCountByBoard(board);
        
        let corFinal = board.cor_hex;
        if (board.tipo === KanbanBoardType.COLABORADOR && board.kanbanStatus?.bg_color) {
          corFinal = board.kanbanStatus.bg_color;
        }
        
        return {
          ...board,
          cor_hex: corFinal,
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
   */
  async create(
    createKanbanBoardDto: CreateKanbanBoardDto,
    currentUser: User,
  ): Promise<KanbanBoard> {
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

      let agenteId = createKanbanBoardDto.agente_id;
      if (!agenteId) {
        if (currentUser.perfil === UserProfile.AGENTE) {
          agenteId = this.normalizeId(currentUser.id);
        } else {
          throw new BadRequestException(
            'agente_id é obrigatório para boards do tipo AGENTE',
          );
        }
      }

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

      let tipoFluxo = createKanbanBoardDto.tipo_fluxo;
      
      if (!tipoFluxo && createKanbanBoardDto.kanban_modelo_id) {
        const modelo = await this.kanbanModeloRepository.findOne({
          where: { kanban_modelo_id: createKanbanBoardDto.kanban_modelo_id },
        });
        tipoFluxo = modelo?.tipo_fluxo || null;
      }

      // Garante que tipo_fluxo não seja null (padrão: COMPRADOR)
      if (!tipoFluxo) {
        tipoFluxo = 'COMPRADOR';
      }

      // Usa transação para garantir rollback em caso de erro
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const board = this.kanbanBoardRepository.create({
          ...createKanbanBoardDto,
          agente_id: agenteId,
          usuario_id_dono: agenteId,
          id_usuario_created_at: this.normalizeId(currentUser.id),
          ordem: createKanbanBoardDto.ordem ?? 0,
          tipo_fluxo: tipoFluxo,
        });
        const savedBoard = await queryRunner.manager.save(KanbanBoard, board);

        // Cria boards automáticos do tipo COLABORADOR dentro da mesma transação
        if (
          savedBoard.tipo === KanbanBoardType.AGENTE &&
          savedBoard.colaborador_id &&
          savedBoard.kanban_modelo_id
        ) {
          await this.createAutomaticBoardsForColaborador(savedBoard, queryRunner);
        }

        await queryRunner.commitTransaction();
        return savedBoard;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw new BadRequestException(
          `Erro ao criar board e boards automáticos: ${error.message || 'Erro desconhecido'}`,
        );
      } finally {
        await queryRunner.release();
      }
    }

    let tipoFluxo = createKanbanBoardDto.tipo_fluxo;
    
    if (!tipoFluxo && createKanbanBoardDto.kanban_modelo_id) {
      const modelo = await this.kanbanModeloRepository.findOne({
        where: { kanban_modelo_id: createKanbanBoardDto.kanban_modelo_id },
      });
      tipoFluxo = modelo?.tipo_fluxo || null;
    }

    // Garante que tipo_fluxo não seja null (padrão: COMPRADOR)
    if (!tipoFluxo) {
      tipoFluxo = 'COMPRADOR';
    }

    // Para boards que não são do tipo AGENTE (ADMIN ou COLABORADOR), cria normalmente
    const board = this.kanbanBoardRepository.create({
      ...createKanbanBoardDto,
      tipo_fluxo: tipoFluxo,
      id_usuario_created_at: this.normalizeId(currentUser.id),
      ordem: createKanbanBoardDto.ordem ?? 0,
    });

    return await this.kanbanBoardRepository.save(board);
  }

  /**
   * Cria boards automáticos no módulo 3 baseados nos status do modelo
   * Usa transação para garantir rollback em caso de erro
   */
  private async createAutomaticBoardsForColaborador(
    boardAgente: KanbanBoard,
    queryRunner: any,
  ): Promise<void> {
    const modelo = await this.kanbanModeloRepository.findOne({
      where: { kanban_modelo_id: boardAgente.kanban_modelo_id },
    });

    const tipoFluxo: TipoFluxo = (boardAgente.tipo_fluxo as TipoFluxo) || 
                                  (modelo?.tipo_fluxo as TipoFluxo) || 
                                  TipoFluxo.COMPRADOR;

    // Verifica se já existe um board 'NOVOS' do tipo COLABORADOR para este colaborador e tipo_fluxo
    const existingNovos = await queryRunner.manager.findOne(KanbanBoard, {
      where: {
        nome: 'NOVOS',
        tipo: KanbanBoardType.COLABORADOR,
        colaborador_id: boardAgente.colaborador_id,
        tipo_fluxo: tipoFluxo,
        active: true,
      },
    });

    // Se não existir, cria o board 'NOVOS' dinamicamente
    if (!existingNovos) {
      const novosBoard = queryRunner.manager.create(KanbanBoard, {
        nome: 'NOVOS',
        cor_hex: '#C6DCFF',
        usuario_id_dono: boardAgente.colaborador_id,
        colaborador_id: boardAgente.colaborador_id,
        kanban_modelo_id: null,
        ordem: 0,
        tipo: KanbanBoardType.COLABORADOR,
        kanban_status_id: null,
        id_usuario_created_at: boardAgente.id_usuario_created_at,
        tipo_fluxo: tipoFluxo,
        active: true,
      });

      await queryRunner.manager.save(KanbanBoard, novosBoard);
    }

    const modeloStatuses = await this.kanbanModeloStatusRepository.find({
      where: { kanban_modelo_id: boardAgente.kanban_modelo_id },
      relations: ['kanbanStatus'],
    });

    let ordem = 1;
    for (const modeloStatus of modeloStatuses) {
      if (modeloStatus.kanbanStatus && modeloStatus.kanbanStatus.active) {
        const statusBoard = queryRunner.manager.create(KanbanBoard, {
          nome: modeloStatus.kanbanStatus.descricao,
          cor_hex: modeloStatus.kanbanStatus.bg_color || boardAgente.cor_hex,
          usuario_id_dono: boardAgente.colaborador_id,
          colaborador_id: boardAgente.colaborador_id,
          kanban_modelo_id: boardAgente.kanban_modelo_id,
          ordem: ordem++,
          tipo: KanbanBoardType.COLABORADOR,
          kanban_status_id: modeloStatus.kanbanStatus.kanban_status_id,
          id_usuario_created_at: boardAgente.id_usuario_created_at,
          tipo_fluxo: tipoFluxo,
          active: true,
        });

        await queryRunner.manager.save(KanbanBoard, statusBoard);
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

    const count = await this.getLeadsCountByBoard(board);
    if (count > 0) {
      throw new BadRequestException(
        'Não é possível excluir um board que contém leads',
      );
    }

    board.active = false;
    await this.kanbanBoardRepository.save(board);
  }

  /**
   * Identifica o tipo de board (NOVO, AGENTE, COLABORADOR, STATUS)
   */
  private getBoardType(board: KanbanBoard): 'NOVO' | 'AGENTE' | 'COLABORADOR' | 'STATUS' {
    // Board NOVO: nome = 'NOVOS'
    if (board.nome === 'NOVOS') {
      return 'NOVO';
    }
    // Board STATUS: tipo = 'COLABORADOR' e tem kanban_status_id
    // Verificar STATUS antes de COLABORADOR para não confundir
    if (board.tipo === KanbanBoardType.COLABORADOR && board.kanban_status_id) {
      return 'STATUS';
    }
    // Board COLABORADOR: tipo = 'COLABORADOR' OU (tipo = 'AGENTE' e tem colaborador_id)
    // Na tela kanban-agente, boards de colaborador têm tipo = 'AGENTE' e colaborador_id
    // IMPORTANTE: Verificar COLABORADOR antes de AGENTE, pois boards de colaborador também têm agente_id
    if ((board.tipo === KanbanBoardType.COLABORADOR || board.tipo === KanbanBoardType.AGENTE) && board.colaborador_id) {
      return 'COLABORADOR';
    }
    // Board AGENTE: tipo = 'AGENTE' OU (tipo = 'ADMIN' e tem agente_id)
    // Na tela kanban-admin, boards de agente têm tipo = 'ADMIN' e agente_id
    // IMPORTANTE: Verificar AGENTE depois de COLABORADOR, pois boards de colaborador também têm agente_id
    if ((board.tipo === KanbanBoardType.AGENTE || board.tipo === KanbanBoardType.ADMIN) && board.agente_id) {
      return 'AGENTE';
    }
    return 'NOVO'; // Fallback
  }

  /**
   * Determina o tipo_fluxo do board (com fallback para modelo)
   */
  private async getTipoFluxo(board: KanbanBoard): Promise<'COMPRADOR' | 'VENDEDOR'> {
    // Primeiro tenta do board
    if (board.tipo_fluxo) {
      return board.tipo_fluxo as 'COMPRADOR' | 'VENDEDOR';
    }
    
    // Se não tiver no board, busca do modelo
    if (board.kanban_modelo_id) {
      const modelo = await this.kanbanModeloRepository.findOne({
        where: { kanban_modelo_id: board.kanban_modelo_id },
      });
      if (modelo?.tipo_fluxo) {
        return modelo.tipo_fluxo as 'COMPRADOR' | 'VENDEDOR';
      }
    }
    
    // Fallback padrão
    return 'COMPRADOR';
  }

  /**
   * Busca registro em lead_kanban_status
   */
  private async findLeadKanbanStatus(
    queryRunner: any,
    leadId: number,
    tipoFluxo: string,
  ): Promise<LeadKanbanStatus | null> {
    const result = await queryRunner.manager.query(
      `SELECT * FROM lead_kanban_status 
       WHERE lead_id = $1 AND tipo_fluxo = $2`,
      [leadId, tipoFluxo],
    );
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Cria ocorrência do tipo USUARIO
   */
  private async createUserOccurrence(
    queryRunner: any,
    leadId: number,
    texto: string,
    currentUser: User,
  ): Promise<void> {
    const occurrence = queryRunner.manager.create(Occurrence, {
      leads_id: leadId,
      texto,
      tipo: OccurrenceType.USUARIO,
      usuarios_id: this.normalizeId(currentUser.id),
    });
    await queryRunner.manager.save(Occurrence, occurrence);
  }

  /**
   * Cria um lead e associa diretamente a um board
   */
  async createLeadInBoard(
    boardId: number,
    createLeadDto: CreateLeadDto,
    currentUser: User,
  ): Promise<Lead> {
    // Busca o board
    const board = await this.findOne(boardId);
    if (!board) {
      throw new NotFoundException('Board não encontrado');
    }

    if (!board.active) {
      throw new BadRequestException('Board deve estar ativo');
    }

    // Identifica o tipo de board
    const boardType = this.getBoardType(board);
    
    // Determina o tipo_fluxo do board
    const tipoFluxo = await this.getTipoFluxo(board);

    // Validações de permissão e dados do lead (similar ao LeadsService.create)
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

      if (currentUser.perfil === UserProfile.AGENTE) {
        const currentUserId = this.normalizeId(currentUser.id);
        const vendedorId = this.normalizeId(createLeadDto.vendedor_id);
        if (vendedorId !== currentUserId) {
          throw new ForbiddenException('Agente só pode criar leads para si mesmo');
        }
      }
    }

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

    // Cria query runner para transação
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Cria o lead
      const newLead = queryRunner.manager.create(Lead, {
        ...leadData,
        data_entrada: createLeadDto.data_entrada ? new Date(createLeadDto.data_entrada) : new Date(),
      });

      const savedLead = await queryRunner.manager.save(Lead, newLead);

      // Processa produtos se fornecidos
      if (produtos && produtos.length > 0) {
        // Valida se os produtos existem
        const produtosExistentes = await this.produtoRepository.find({
          where: produtos.map(id => ({ produto_id: id })),
        });

        const produtosExistentesIds = produtosExistentes.map(p => p.produto_id);
        const produtosInvalidos = produtos.filter(id => !produtosExistentesIds.includes(id));

        if (produtosInvalidos.length > 0) {
          throw new BadRequestException(`Produtos inválidos: ${produtosInvalidos.join(', ')}`);
        }

        // Cria associações de produtos
        for (const produtoId of produtos) {
          const leadsProduto = queryRunner.manager.create(LeadsProduto, {
            leads_id: savedLead.id,
            produto_id: produtoId,
          });
          await queryRunner.manager.save(LeadsProduto, leadsProduto);
        }
      }

      // Insere em lead_kanban_status conforme as regras
      let vendedorId: number | null = null;
      let usuarioIdColaborador: number | null = null;
      let kanbanStatusId: number | null = null;

      // Aplica regras conforme o tipo de board e tela
      if (board.tipo === KanbanBoardType.ADMIN) {
        // Kanban-Admin
        if (boardType === 'NOVO') {
          // Board "NOVO" (agente_id = null)
          vendedorId = null;
          usuarioIdColaborador = null;
          kanbanStatusId = null;
        } else if (boardType === 'AGENTE') {
          // Board de agente (agente_id != null)
          vendedorId = board.agente_id;
          usuarioIdColaborador = null;
          kanbanStatusId = null;
        }
      } else if (board.tipo === KanbanBoardType.AGENTE) {
        // Kanban-Agente
        if (boardType === 'NOVO') {
          // Board "NOVO" (agente_id = null)
          vendedorId = board.agente_id; // Usa valor do board (mesmo que seja null)
          usuarioIdColaborador = null;
          kanbanStatusId = null;
        } else if (boardType === 'COLABORADOR') {
          // Board de colaborador (colaborador_id != null)
          vendedorId = board.agente_id;
          usuarioIdColaborador = board.colaborador_id;
          kanbanStatusId = null;
        }
      } else if (board.tipo === KanbanBoardType.COLABORADOR) {
        // Kanban-Colaborador
        if (boardType === 'NOVO') {
          // Board "NOVO" (agente_id = null)
          vendedorId = board.agente_id; // Usa valor do board (mesmo que seja null)
          usuarioIdColaborador = board.colaborador_id;
          kanbanStatusId = null;
        } else if (boardType === 'STATUS') {
          // Board de status (kanban_status_id != null)
          vendedorId = board.agente_id;
          usuarioIdColaborador = board.colaborador_id;
          kanbanStatusId = board.kanban_status_id;
        }
      }

      // Insere em lead_kanban_status
      await queryRunner.manager.query(
        `INSERT INTO lead_kanban_status 
         (lead_id, tipo_fluxo, vendedor_id, usuario_id_colaborador, kanban_status_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [savedLead.id, tipoFluxo, vendedorId, usuarioIdColaborador, kanbanStatusId],
      );

      // Commit da transação
      await queryRunner.commitTransaction();

      // Busca lead completo com relações
      const lead = await this.leadsRepository.findOne({
        where: { id: savedLead.id },
        relations: ['vendedor', 'colaborador'],
      });

      // Busca produtos relacionados
      const leadsProdutos = await this.leadsProdutoRepository.find({
        where: { leads_id: savedLead.id },
        relations: ['produto'],
      });

      // Adiciona produtos ao lead
      (lead as any).produtos = leadsProdutos.map(lp => lp.produto);

      return lead;
    } catch (error) {
      // Rollback em caso de erro
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Libera a conexão
      await queryRunner.release();
    }
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

    // Valida que os boards estão ativos
    if (!fromBoard.active || !toBoard.active) {
      throw new BadRequestException('Boards devem estar ativos');
    }

    // Valida que não está movendo para o mesmo board
    if (fromBoardId === toBoardId) {
      throw new BadRequestException('Não é possível mover para o mesmo board');
    }

    // Identifica tipos de boards
    const fromBoardType = this.getBoardType(fromBoard);
    const toBoardType = this.getBoardType(toBoard);

    // Determina tipo_fluxo do board destino
    const tipoFluxo = await this.getTipoFluxo(toBoard);

    // Cria query runner para transação
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Busca registro atual em lead_kanban_status
      const currentLks = await this.findLeadKanbanStatus(queryRunner, leadId, tipoFluxo);

      // Se não existe registro e não é movimento de NOVO, lança erro
      if (!currentLks && fromBoardType !== 'NOVO') {
        throw new BadRequestException('Registro de lead_kanban_status não encontrado');
      }

      // Aplica regras conforme o tipo de movimentação
      if (fromBoard.tipo === KanbanBoardType.ADMIN) {
        // Kanban-admin
        if (fromBoardType === 'NOVO' && toBoardType === 'AGENTE') {
          // Regra 1.1: NOVO → AGENTE
          if (!toBoard.agente_id) {
            throw new BadRequestException('Board destino não possui agente_id');
          }
          if (currentLks) {
            // UPDATE
            await queryRunner.manager.query(
              `UPDATE lead_kanban_status 
               SET vendedor_id = $1, usuario_id_colaborador = NULL, kanban_status_id = NULL, updated_at = NOW()
               WHERE lead_id = $2 AND tipo_fluxo = $3`,
              [toBoard.agente_id, leadId, tipoFluxo],
            );
          } else {
            // INSERT
            await queryRunner.manager.query(
              `INSERT INTO lead_kanban_status 
               (lead_id, tipo_fluxo, vendedor_id, usuario_id_colaborador, kanban_status_id, created_at, updated_at)
               VALUES ($1, $2, $3, NULL, NULL, NOW(), NOW())`,
              [leadId, tipoFluxo, toBoard.agente_id],
            );
          }
        } else if (fromBoardType === 'AGENTE' && toBoardType === 'NOVO') {
          // Regra 1.2: AGENTE → NOVO
          await queryRunner.manager.query(
            `UPDATE lead_kanban_status 
             SET vendedor_id = NULL, usuario_id_colaborador = NULL, kanban_status_id = NULL, updated_at = NOW()
             WHERE lead_id = $1 AND tipo_fluxo = $2`,
            [leadId, tipoFluxo],
          );
        } else if (fromBoardType === 'AGENTE' && toBoardType === 'AGENTE') {
          // Regra 1.3: AGENTE → AGENTE
          await queryRunner.manager.query(
            `UPDATE lead_kanban_status 
             SET vendedor_id = $1, usuario_id_colaborador = NULL, kanban_status_id = NULL, updated_at = NOW()
             WHERE lead_id = $2 AND tipo_fluxo = $3`,
            [toBoard.agente_id, leadId, tipoFluxo],
          );
        } else {
          throw new BadRequestException('Movimentação inválida para Kanban-admin');
        }
      } else if (fromBoard.tipo === KanbanBoardType.AGENTE) {
        // Kanban-agente
        if (fromBoardType === 'NOVO' && toBoardType === 'COLABORADOR') {
          // Regra 2.1: NOVO → COLABORADOR
          // vendedor_id = sem alteração, usuario_id_colaborador = id do board destino, kanban_status_id = null
          if (!toBoard.colaborador_id) {
            throw new BadRequestException('Board destino não possui colaborador_id');
          }
          await queryRunner.manager.query(
            `UPDATE lead_kanban_status 
             SET usuario_id_colaborador = $1, kanban_status_id = NULL, updated_at = NOW()
             WHERE lead_id = $2 AND tipo_fluxo = $3`,
            [toBoard.colaborador_id, leadId, tipoFluxo],
          );
        } else if (fromBoardType === 'COLABORADOR' && toBoardType === 'NOVO') {
          // Regra 2.2: COLABORADOR → NOVO
          // vendedor_id = sem alteração, usuario_id_colaborador = null, kanban_status_id = null
          await queryRunner.manager.query(
            `UPDATE lead_kanban_status 
             SET usuario_id_colaborador = NULL, kanban_status_id = NULL, updated_at = NOW()
             WHERE lead_id = $1 AND tipo_fluxo = $2`,
            [leadId, tipoFluxo],
          );
        } else if (fromBoardType === 'COLABORADOR' && toBoardType === 'COLABORADOR') {
          // Regra 2.3: COLABORADOR → COLABORADOR
          // vendedor_id = sem alteração, usuario_id_colaborador = id do board destino, kanban_status_id = null
          if (!toBoard.colaborador_id) {
            throw new BadRequestException('Board destino não possui colaborador_id');
          }
          await queryRunner.manager.query(
            `UPDATE lead_kanban_status 
             SET usuario_id_colaborador = $1, kanban_status_id = NULL, updated_at = NOW()
             WHERE lead_id = $2 AND tipo_fluxo = $3`,
            [toBoard.colaborador_id, leadId, tipoFluxo],
          );
        } else {
          throw new BadRequestException('Movimentação inválida para Kanban-agente');
        }
      } else if (fromBoard.tipo === KanbanBoardType.COLABORADOR) {
        // Kanban-colaborador
        if (fromBoardType === 'NOVO' && toBoardType === 'STATUS') {
          // Regra 3.1: NOVO → STATUS
          // vendedor_id = sem alteração, usuario_id_colaborador = SEM ALTERAÇÃO, kanban_status_id = id do board destino
          if (!toBoard.kanban_status_id) {
            throw new BadRequestException('Board destino não possui kanban_status_id');
          }
          await queryRunner.manager.query(
            `UPDATE lead_kanban_status 
             SET kanban_status_id = $1, updated_at = NOW()
             WHERE lead_id = $2 AND tipo_fluxo = $3`,
            [toBoard.kanban_status_id, leadId, tipoFluxo],
          );
        } else if (fromBoardType === 'STATUS' && toBoardType === 'NOVO') {
          // Regra 3.2: STATUS → NOVO
          // vendedor_id = sem alteração, usuario_id_colaborador = SEM ALTERAÇÃO, kanban_status_id = null
          await queryRunner.manager.query(
            `UPDATE lead_kanban_status 
             SET kanban_status_id = NULL, updated_at = NOW()
             WHERE lead_id = $1 AND tipo_fluxo = $2`,
            [leadId, tipoFluxo],
          );
        } else if (fromBoardType === 'STATUS' && toBoardType === 'STATUS') {
          // Regra 3.3: STATUS → STATUS
          // vendedor_id = sem alteração, usuario_id_colaborador = SEM ALTERAÇÃO, kanban_status_id = id do board destino
          if (!toBoard.kanban_status_id) {
            throw new BadRequestException('Board destino não possui kanban_status_id');
          }
          await queryRunner.manager.query(
            `UPDATE lead_kanban_status 
             SET kanban_status_id = $1, updated_at = NOW()
             WHERE lead_id = $2 AND tipo_fluxo = $3`,
            [toBoard.kanban_status_id, leadId, tipoFluxo],
          );
        } else {
          throw new BadRequestException('Movimentação inválida para Kanban-colaborador');
        }
      } else {
        throw new BadRequestException('Tipo de board origem inválido');
      }

      // Cria ocorrência do tipo USUARIO
      const textoOcorrencia = `Lead movido de "${fromBoard.nome}" para "${toBoard.nome}"`;
      await this.createUserOccurrence(queryRunner, leadId, textoOcorrencia, currentUser);

      // Commit da transação
      await queryRunner.commitTransaction();

      // Retorna lead atualizado
      return await this.leadsRepository.findOne({
        where: { id: leadId },
      });
    } catch (error) {
      // Rollback em caso de erro
      try {
        await queryRunner.rollbackTransaction();
      } catch (rollbackError: any) {
        // Ignora erro de rollback se a transação já foi finalizada ou não foi iniciada
        if (rollbackError?.message?.includes('Transaction is not started')) {
          // Transação não estava ativa, ignora o erro
        } else {
          // Outro tipo de erro no rollback, loga mas não interrompe
          console.error('Erro ao fazer rollback:', rollbackError);
        }
      }
      throw error;
    } finally {
      // Libera conexão
      await queryRunner.release();
    }
  }

  /**
   * Cria ocorrência do tipo SISTEMA
   */
  private async createSystemOccurrence(
    leadId: number,
    texto: string,
    currentUser: User,
    tipoFluxo?: 'COMPRADOR' | 'VENDEDOR' | null,
  ): Promise<Occurrence> {
    const userId = this.normalizeId(currentUser.id);

    const occurrence = this.occurrencesRepository.create({
      leads_id: leadId,
      usuarios_id: userId,
      texto,
      tipo: OccurrenceType.SISTEMA,
      tipo_fluxo: tipoFluxo || null,
    });

    return await this.occurrencesRepository.save(occurrence);
  }

  /**
   * Busca leads de um board com paginação e filtros
   * MÉTODO COM LOGS SQL DETALHADOS
   */
  async getLeadsByBoard(
    boardId: number,
    filterDto: FilterLeadsDto,
    currentUser: User,
  ): Promise<{ 
    data: Lead[]; 
    total: number; 
    page: number; 
    limit: number;
    sql?: string;
    sqlRaw?: string;
    params?: Record<string, any>;
  }> {
    try {
      const board = await this.findOne(boardId);
      const page = filterDto.page || 1;
      const limit = filterDto.limit || 50;

      // Determinar tipo_fluxo do board (com fallback para modelo)
      let tipoFluxo: TipoFluxo = (board.tipo_fluxo as TipoFluxo) || TipoFluxo.COMPRADOR;
      
      if (!board.tipo_fluxo && board.kanban_modelo_id) {
        const modelo = await this.kanbanModeloRepository.findOne({
          where: { kanban_modelo_id: board.kanban_modelo_id },
        });
        if (modelo?.tipo_fluxo) {
          tipoFluxo = modelo.tipo_fluxo as TipoFluxo;
        }
      }
      
      // Garantir que tipoFluxo seja sempre uma string literal (não enum)
      // Força conversão explícita para string primitiva
      const tipoFluxoString = typeof tipoFluxo === 'string' ? tipoFluxo : String(tipoFluxo);
      // Remove qualquer caractere especial que possa ter sido adicionado
      const tipoFluxoClean = tipoFluxoString.replace(/[{}]/g, '').trim();

      // ========== LOGS INICIAIS ==========
      console.log(`[getLeadsByBoard] ==========================================`);
      console.log(`[getLeadsByBoard] Board ID: ${boardId}`);
      console.log(`[getLeadsByBoard] Board Nome: ${board.nome}`);
      console.log(`[getLeadsByBoard] Board Tipo: ${board.tipo}`);
      console.log(`[getLeadsByBoard] Board tipo_fluxo (raw): ${board.tipo_fluxo} (tipo: ${typeof board.tipo_fluxo})`);
      console.log(`[getLeadsByBoard] Tipo Fluxo (enum): ${tipoFluxo}`);
      console.log(`[getLeadsByBoard] Tipo Fluxo (string original): ${tipoFluxoString}`);
      console.log(`[getLeadsByBoard] Tipo Fluxo (string limpa): ${tipoFluxoClean}`);
      console.log(`[getLeadsByBoard] Board agente_id: ${board.agente_id}`);
      console.log(`[getLeadsByBoard] Board colaborador_id: ${board.colaborador_id}`);
      console.log(`[getLeadsByBoard] Board kanban_status_id: ${board.kanban_status_id}`);
      console.log(`[getLeadsByBoard] ==========================================`);

      const queryBuilder = this.leadsRepository.createQueryBuilder('lead');

      // Aplica filtros conforme o tipo de board
      if (board.tipo === KanbanBoardType.ADMIN) {
        if (board.nome === 'NOVOS') {
          // Usa string literal diretamente na query para evitar problemas de serialização do TypeORM
          const tipoFluxoEscaped = tipoFluxoClean.replace(/'/g, "''"); // Escapa aspas simples para SQL
          queryBuilder.leftJoin(
            'lead_kanban_status',
            'lks',
            `lks.lead_id = lead.id AND lks.tipo_fluxo = '${tipoFluxoEscaped}'`
          );
          queryBuilder.andWhere(
            '(lks.lead_id IS NULL OR lks.vendedor_id IS NULL)'
          );
          console.log('[getLeadsByBoard] Filtro ADMIN NOVOS: leads sem registro OU com vendedor_id IS NULL');
        } else {
          // Log para debug
          console.log(`[getLeadsByBoard] Passando tipo_fluxo para INNER JOIN:`, {
            valor: tipoFluxoClean,
            tipo: typeof tipoFluxoClean,
            JSON: JSON.stringify(tipoFluxoClean),
            length: tipoFluxoClean.length
          });
          
          // Usa string literal diretamente na query para evitar problemas de serialização do TypeORM
          const tipoFluxoEscaped = tipoFluxoClean.replace(/'/g, "''"); // Escapa aspas simples para SQL
          queryBuilder.innerJoin(
            'lead_kanban_status',
            'lks',
            `lks.lead_id = lead.id AND lks.tipo_fluxo = '${tipoFluxoEscaped}'`
          );
          if (board.agente_id) {
            const agenteId = this.normalizeId(board.agente_id);
            queryBuilder.andWhere('lks.vendedor_id = :agente_id', {
              agente_id: agenteId,
            });
            console.log('[getLeadsByBoard] Filtro aplicado: lks.vendedor_id =', agenteId);
          } else {
            console.warn('[getLeadsByBoard] Board ADMIN sem agente_id:', board.id, board.nome);
          }
        }
      } else if (board.tipo === KanbanBoardType.AGENTE) {
        queryBuilder.innerJoin(
          'lead_kanban_status',
          'lks',
          'lks.lead_id = lead.id AND lks.tipo_fluxo = :tipo_fluxo',
          { tipo_fluxo: tipoFluxoClean }
        );
        
        if (board.nome === 'NOVOS') {
          if (board.agente_id) {
            queryBuilder.andWhere('lks.vendedor_id = :agente_id', {
              agente_id: board.agente_id,
            });
            queryBuilder.andWhere('lks.usuario_id_colaborador IS NULL');
            console.log('[getLeadsByBoard] Filtro AGENTE NOVOS: lks.vendedor_id =', board.agente_id, 'AND lks.usuario_id_colaborador IS NULL');
          }
        } else {
          if (board.colaborador_id) {
            queryBuilder.andWhere('lks.usuario_id_colaborador = :colaborador_id', {
              colaborador_id: board.colaborador_id,
            });
            console.log('[getLeadsByBoard] Filtro AGENTE Colaborador: lks.usuario_id_colaborador =', board.colaborador_id);
          }
        }
      } else if (board.tipo === KanbanBoardType.COLABORADOR) {
        // Usa string literal diretamente na query para garantir comparação correta
        const tipoFluxoEscaped = tipoFluxoClean.replace(/'/g, "''"); // Escapa aspas simples para SQL
        queryBuilder.innerJoin(
          'lead_kanban_status',
          'lks',
          `lks.lead_id = lead.id AND lks.tipo_fluxo = '${tipoFluxoEscaped}'`
        );
        
        if (board.nome === 'NOVOS') {
          if (board.colaborador_id) {
            queryBuilder.andWhere('lks.usuario_id_colaborador = :colaborador_id', {
              colaborador_id: board.colaborador_id,
            });
            queryBuilder.andWhere('lks.kanban_status_id IS NULL');
            console.log('[getLeadsByBoard] Filtro COLABORADOR NOVOS: lks.usuario_id_colaborador =', board.colaborador_id, 'AND lks.kanban_status_id IS NULL, tipo_fluxo =', tipoFluxoClean);
          }
        } else {
          if (board.kanban_status_id && board.colaborador_id) {
            queryBuilder.andWhere('lks.kanban_status_id = :kanban_status_id', {
              kanban_status_id: board.kanban_status_id,
            });
            queryBuilder.andWhere('lks.usuario_id_colaborador = :colaborador_id', {
              colaborador_id: board.colaborador_id,
            });
            console.log('[getLeadsByBoard] Filtro COLABORADOR Status: lks.kanban_status_id =', board.kanban_status_id, 'AND lks.usuario_id_colaborador =', board.colaborador_id, ', tipo_fluxo =', tipoFluxoClean);
          }
        }
      }

      // Filtro por tipo_lead para boards ADMIN (baseado no tipoFluxo selecionado)
      if (board.tipo === KanbanBoardType.ADMIN) {
        // Verifica se o array tipo_lead contém o tipoFluxo atual
        // Isso permite que leads com ['VENDEDOR', 'COMPRADOR'] apareçam em ambos os fluxos
        queryBuilder.andWhere(':tipoFluxo = ANY(lead.tipo_lead)', { tipoFluxo: tipoFluxoClean });
        console.log('[getLeadsByBoard] Filtro tipo_lead aplicado para ADMIN:', tipoFluxoClean);
      }

      // Filtro por nome/razão social
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

      // Filtro por email (busca parcial, case-insensitive)
      if (filterDto.email) {
        queryBuilder.andWhere(
          'LOWER(lead.email) ILIKE LOWER(:email)',
          { email: `%${filterDto.email.trim()}%` }
        );
      }

      // Filtro por telefone (busca parcial, apenas números)
      // Remove formatação (parênteses, traços, espaços) e busca apenas pelos números
      if (filterDto.telefone) {
        const telefoneNumeros = filterDto.telefone.trim().replace(/\D/g, ''); // Remove tudo que não é número
        if (telefoneNumeros) {
          // Remove formatação do telefone no banco e compara apenas números
          queryBuilder.andWhere(
            `REGEXP_REPLACE(lead.telefone, '[^0-9]', '', 'g') ILIKE :telefone`,
            { telefone: `%${telefoneNumeros}%` }
          );
        }
      }

      // Filtro por UF
      if (filterDto.uf) {
        queryBuilder.andWhere('lead.uf = :uf', { uf: filterDto.uf });
      }

      // Filtro por vendedor
      if (filterDto.vendedor_id) {
        if (currentUser.perfil === UserProfile.AGENTE) {
          const currentUserId = this.normalizeId(currentUser.id);
          const vendedorId = this.normalizeId(filterDto.vendedor_id);
          if (vendedorId !== currentUserId) {
            throw new ForbiddenException('Agente não pode filtrar por outro vendedor');
          }
        }
        const vendedorId = this.normalizeId(filterDto.vendedor_id);
        if (board.tipo === KanbanBoardType.ADMIN && board.nome === 'NOVOS') {
          queryBuilder.andWhere('lks.lead_id IS NOT NULL AND lks.vendedor_id = :vendedorId', { vendedorId });
        } else {
          queryBuilder.andWhere('lks.vendedor_id = :vendedorId', { vendedorId });
        }
      }

      // Filtro por colaborador
      if (filterDto.usuario_id_colaborador) {
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
        if (currentUser.perfil === UserProfile.COLABORADOR) {
          const currentUserId = this.normalizeId(currentUser.id);
          const colaboradorId = this.normalizeId(filterDto.usuario_id_colaborador);
          if (colaboradorId !== currentUserId) {
            throw new ForbiddenException('Colaborador só pode ver seus próprios leads');
          }
        }
        const colaboradorId = this.normalizeId(filterDto.usuario_id_colaborador);
        if (board.tipo === KanbanBoardType.ADMIN && board.nome === 'NOVOS') {
          queryBuilder.andWhere('lks.lead_id IS NOT NULL AND lks.usuario_id_colaborador = :colaboradorId', { 
            colaboradorId
          });
        } else {
          queryBuilder.andWhere('lks.usuario_id_colaborador = :colaboradorId', { 
            colaboradorId
          });
        }
      }

      // Filtro por origem do lead
      if (filterDto.origem_lead) {
        queryBuilder.andWhere('lead.origem_lead = :origemLead', { origemLead: filterDto.origem_lead });
      }

      // Filtro por produtos
      if (filterDto.produtos && filterDto.produtos.length > 0) {
        queryBuilder.andWhere(
          `EXISTS (SELECT 1 FROM leads_produto WHERE leads_produto.leads_id = lead.id AND leads_produto.produto_id IN (:...produtoIds))`,
          {
            produtoIds: filterDto.produtos,
          }
        );
      }

      // Ordenação
      queryBuilder.orderBy('lead.created_at', 'DESC');

      // ========== LOGS SQL DETALHADOS ==========
      // Força conversão de parâmetros para strings antes de obter a SQL
      const paramsBefore = queryBuilder.getParameters();
      const normalizedParams: Record<string, any> = {};
      Object.keys(paramsBefore).forEach(key => {
        const value = paramsBefore[key];
        // Converte enums e valores para strings explícitas
        if (value && typeof value === 'object' && value.constructor && value.constructor.name !== 'Array') {
          normalizedParams[key] = String(value);
        } else if (Array.isArray(value)) {
          normalizedParams[key] = value.map(v => String(v));
        } else {
          normalizedParams[key] = value === null || value === undefined ? value : String(value);
        }
      });
      
      const sql = queryBuilder.getSql();
      const params = normalizedParams;
      
      console.log(`[getLeadsByBoard] ========== SQL QUERY PARA BOARD ${boardId} (${board.nome}) ==========`);
      console.log('[getLeadsByBoard] SQL Query GERADA pelo TypeORM:');
      console.log('---');
      console.log(sql);
      console.log('---');
      console.log('[getLeadsByBoard] Parâmetros da Query (normalizados):');
      console.log(JSON.stringify(params, null, 2));
      console.log('[getLeadsByBoard] Tipo de tipo_fluxo:', typeof params.tipo_fluxo, params.tipo_fluxo);
      
      // Gera query SQL com parâmetros substituídos para debug (pronta para copiar e testar)
      let debugSql = sql;
      Object.keys(params).forEach(key => {
        const value = params[key];
        const regex = new RegExp(`:${key}\\b`, 'g');
        // Converte para string primeiro para tratar enums corretamente
        const stringValue = String(value);
        if (typeof value === 'string' || (value && value.constructor && value.constructor.name === 'String')) {
          debugSql = debugSql.replace(regex, `'${stringValue.replace(/'/g, "''")}'`);
        } else if (value === null || value === undefined) {
          debugSql = debugSql.replace(regex, 'NULL');
        } else if (Array.isArray(value)) {
          debugSql = debugSql.replace(regex, `(${value.map(v => {
            const vStr = String(v);
            return typeof v === 'string' ? `'${vStr.replace(/'/g, "''")}'` : vStr;
          }).join(', ')})`);
        } else {
          // Para enums e outros tipos, converte para string e trata como string
          debugSql = debugSql.replace(regex, `'${stringValue.replace(/'/g, "''")}'`);
        }
      });
      console.log('[getLeadsByBoard] SQL Query PRONTA PARA TESTAR (com parâmetros substituídos):');
      console.log('---');
      console.log(debugSql);
      console.log('---');
      console.log(`[getLeadsByBoard] ========== FIM SQL QUERY BOARD ${boardId} ==========`);

      // Salva SQL antes de executar queries (para retornar ao frontend)
      const sqlForResponse = debugSql;
      const sqlRawForResponse = sql;
      const paramsForResponse = { ...params };

      // Contagem total antes da paginação
      const total = await queryBuilder.getCount();
      console.log('[getLeadsByBoard] Total de leads encontrados:', total);
      
      // Paginação
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      // Busca os leads
      const leads = await queryBuilder.getMany();
      console.log('[getLeadsByBoard] Leads retornados:', leads.length);

      // Carrega relações de lead_kanban_status para todos os leads de uma vez
      if (leads.length > 0) {
        const leadIds = leads.map(lead => lead.id);
        
        // Pre-query: Verifica se há registros na tabela lead_kanban_status
        const preCheckQueryBuilder = this.leadsRepository.manager
          .createQueryBuilder()
          .select('COUNT(*)', 'count')
          .from('lead_kanban_status', 'lks')
          .where('lks.lead_id IN (:...leadIds)', { leadIds })
          .andWhere(`lks.tipo_fluxo = '${tipoFluxoClean.replace(/'/g, "''")}'`);
        
        const preCheckResult = await preCheckQueryBuilder.getRawOne();
        console.log('[getLeadsByBoard] Pre-query check lead_kanban_status - Total de registros:', preCheckResult?.count || 0);
        
        try {
          // Busca registros de lead_kanban_status com suas relações usando query builder
          const lksQueryBuilder = this.leadsRepository.manager
            .createQueryBuilder()
            .select([
              'lks.id',
              'lks.lead_id',
              'lks.kanban_status_id',
              'lks.vendedor_id',
              'lks.usuario_id_colaborador',
              'lks.tipo_fluxo',
            ])
            .addSelect('u_vendedor.id', 'vendedor_id_join')
            .addSelect('u_vendedor.nome', 'vendedor_nome')
            .addSelect('u_colaborador.id', 'colaborador_id_join')
            .addSelect('u_colaborador.nome', 'colaborador_nome')
            .addSelect('ks.kanban_status_id', 'status_id_join')
            .addSelect('ks.descricao', 'status_descricao')
            .from('lead_kanban_status', 'lks')
            .leftJoin('usuarios', 'u_vendedor', 'lks.vendedor_id = u_vendedor.id')
            .leftJoin('usuarios', 'u_colaborador', 'lks.usuario_id_colaborador = u_colaborador.id')
            .leftJoin('kanban_status', 'ks', 'lks.kanban_status_id = ks.kanban_status_id')
            .where('lks.lead_id IN (:...leadIds)', { leadIds })
            .andWhere(`lks.tipo_fluxo = '${tipoFluxoClean.replace(/'/g, "''")}'`);
          
          const lksRecords = await lksQueryBuilder.getRawMany();
          
          console.log('[getLeadsByBoard] Registros de lead_kanban_status encontrados:', lksRecords.length);
          
          // Agrupa por lead_id
          const lksPorLead = new Map<number, any>();
          lksRecords.forEach((lks: any) => {
            if (!lksPorLead.has(lks.lead_id)) {
              lksPorLead.set(lks.lead_id, {
                vendedor: lks.vendedor_id_join ? {
                  id: lks.vendedor_id_join,
                  nome: lks.vendedor_nome
                } : null,
                colaborador: lks.colaborador_id_join ? {
                  id: lks.colaborador_id_join,
                  nome: lks.colaborador_nome
                } : null,
                kanbanStatus: lks.status_id_join ? {
                  kanban_status_id: lks.status_id_join,
                  descricao: lks.status_descricao
                } : null
              });
            }
          });
          
          // Adiciona relações a cada lead
          leads.forEach(lead => {
            const lks = lksPorLead.get(lead.id);
            if (lks) {
              (lead as any).vendedor = lks.vendedor;
              (lead as any).colaborador = lks.colaborador;
              (lead as any).kanbanStatus = lks.kanbanStatus;
            }
          });
        } catch (lksError) {
          console.error('[getLeadsByBoard] Erro ao carregar relações de lead_kanban_status:', lksError);
          // Continua sem as relações se houver erro
        }
      }

      // Carrega produtos para todos os leads de uma vez
      if (leads.length > 0) {
        const leadIds = leads.map(lead => lead.id);
        const leadsProdutos = await this.leadsProdutoRepository.find({
          where: { leads_id: In(leadIds) },
          relations: ['produto'],
        });

        const produtosPorLead = new Map<number, Map<number, any>>();
        leadsProdutos.forEach(lp => {
          if (!produtosPorLead.has(lp.leads_id)) {
            produtosPorLead.set(lp.leads_id, new Map());
          }
          const produtosMap = produtosPorLead.get(lp.leads_id)!;
          if (!produtosMap.has(lp.produto.produto_id)) {
            produtosMap.set(lp.produto.produto_id, lp.produto);
          }
        });

        leads.forEach(lead => {
          const produtosMap = produtosPorLead.get(lead.id);
          (lead as any).produtos = produtosMap ? Array.from(produtosMap.values()) : [];
        });
      }

      // Debug: Log do que está sendo retornado
      console.log('[getLeadsByBoard] Retornando resposta:');
      console.log('[getLeadsByBoard]   - Total:', total);
      console.log('[getLeadsByBoard]   - Leads no array:', leads.length);
      console.log('[getLeadsByBoard]   - Page:', page);
      console.log('[getLeadsByBoard]   - Limit:', limit);
      if (leads.length > 0) {
        console.log('[getLeadsByBoard]   - Primeiro lead ID:', leads[0].id);
        console.log('[getLeadsByBoard]   - Primeiro lead nome:', leads[0].nome_razao_social);
      }

      return {
        data: leads,
        total,
        page,
        limit,
        sql: sqlForResponse, // SQL com parâmetros substituídos (pronta para testar)
        sqlRaw: sqlRawForResponse, // SQL com placeholders
        params: paramsForResponse, // Parâmetros separados
      };
    } catch (error) {
      console.error('[getLeadsByBoard] Erro ao buscar leads:', error);
      console.error('[getLeadsByBoard] Stack:', error.stack);
      console.error('[getLeadsByBoard] Error message:', error.message);
      if (error instanceof Error) {
        console.error('[getLeadsByBoard] Error name:', error.name);
      }
      throw new BadRequestException(`Erro ao buscar leads: ${error.message || 'Erro desconhecido'}`);
    }
  }

  /**
   * Retorna contagem de leads de um board
   */
  private async getLeadsCountByBoard(board: KanbanBoard): Promise<number> {
    const queryBuilder = this.leadsRepository.createQueryBuilder('lead');

    let tipoFluxo: TipoFluxo = (board.tipo_fluxo as TipoFluxo) || TipoFluxo.COMPRADOR;
    
    if (!board.tipo_fluxo && board.kanban_modelo_id) {
      const modelo = await this.kanbanModeloRepository.findOne({
        where: { kanban_modelo_id: board.kanban_modelo_id },
      });
      if (modelo?.tipo_fluxo) {
        tipoFluxo = modelo.tipo_fluxo as TipoFluxo;
      }
    }

    // Garantir que tipoFluxo seja sempre uma string literal (não enum)
    const tipoFluxoString = typeof tipoFluxo === 'string' ? tipoFluxo : String(tipoFluxo);
    const tipoFluxoClean = tipoFluxoString.replace(/[{}]/g, '').trim();
    
    // Usa string literal diretamente na query para evitar problemas de serialização do TypeORM
    const tipoFluxoEscaped = tipoFluxoClean.replace(/'/g, "''"); // Escapa aspas simples para SQL
    queryBuilder.innerJoin('lead_kanban_status', 'lks', 'lks.lead_id = lead.id');
    queryBuilder.andWhere(`lks.tipo_fluxo = '${tipoFluxoEscaped}'`);

    if (board.tipo === KanbanBoardType.ADMIN) {
      if (board.nome === 'NOVOS') {
        queryBuilder.andWhere('lks.vendedor_id IS NULL');
      } else {
        queryBuilder.andWhere('lks.vendedor_id = :agente_id', {
          agente_id: board.agente_id,
        });
      }
    } else if (board.tipo === KanbanBoardType.AGENTE) {
      if (board.nome === 'NOVOS') {
        queryBuilder.andWhere('lks.vendedor_id = :agente_id', {
          agente_id: board.agente_id,
        });
        queryBuilder.andWhere('lks.usuario_id_colaborador IS NULL');
      } else {
        queryBuilder.andWhere('lks.usuario_id_colaborador = :colaborador_id', {
          colaborador_id: board.colaborador_id,
        });
      }
    } else if (board.tipo === KanbanBoardType.COLABORADOR) {
      if (board.nome === 'NOVOS') {
        queryBuilder.andWhere('lks.usuario_id_colaborador = :colaborador_id', {
          colaborador_id: board.colaborador_id,
        });
        queryBuilder.andWhere('lks.kanban_status_id IS NULL');
      } else {
        queryBuilder.andWhere('lks.kanban_status_id = :kanban_status_id', {
          kanban_status_id: board.kanban_status_id,
        });
        queryBuilder.andWhere('lks.usuario_id_colaborador = :colaborador_id', {
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

    for (let i = 0; i < boardIds.length; i++) {
      const board = boards.find((b) => b.id === boardIds[i]);
      if (board) {
        board.ordem = i;
      }
    }

    return await this.kanbanBoardRepository.save(boards);
  }
}
