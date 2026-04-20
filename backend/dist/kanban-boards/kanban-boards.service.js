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
exports.KanbanBoardsService = exports.TipoFluxo = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const XLSX = require("xlsx");
const kanban_board_entity_1 = require("./entities/kanban-board.entity");
const lead_entity_1 = require("../leads/entities/lead.entity");
const user_entity_1 = require("../users/entities/user.entity");
const kanban_modelo_entity_1 = require("../kanban-modelos/entities/kanban-modelo.entity");
const kanban_modelo_status_entity_1 = require("../kanban-modelos/entities/kanban-modelo-status.entity");
const kanban_status_entity_1 = require("../kanban-modelos/entities/kanban-status.entity");
const occurrence_entity_1 = require("../occurrences/entities/occurrence.entity");
const leads_produto_entity_1 = require("../leads-produtos/entities/leads-produto.entity");
const produto_entity_1 = require("../produtos/entities/produto.entity");
const pg_unaccent_search_1 = require("../database/pg-unaccent-search");
var TipoFluxo;
(function (TipoFluxo) {
    TipoFluxo["COMPRADOR"] = "COMPRADOR";
    TipoFluxo["VENDEDOR"] = "VENDEDOR";
})(TipoFluxo || (exports.TipoFluxo = TipoFluxo = {}));
let KanbanBoardsService = class KanbanBoardsService {
    constructor(kanbanBoardRepository, leadsRepository, usersRepository, kanbanModeloRepository, kanbanModeloStatusRepository, kanbanStatusRepository, occurrencesRepository, leadsProdutoRepository, produtoRepository, dataSource) {
        this.kanbanBoardRepository = kanbanBoardRepository;
        this.leadsRepository = leadsRepository;
        this.usersRepository = usersRepository;
        this.kanbanModeloRepository = kanbanModeloRepository;
        this.kanbanModeloStatusRepository = kanbanModeloStatusRepository;
        this.kanbanStatusRepository = kanbanStatusRepository;
        this.occurrencesRepository = occurrencesRepository;
        this.leadsProdutoRepository = leadsProdutoRepository;
        this.produtoRepository = produtoRepository;
        this.dataSource = dataSource;
    }
    normalizeId(id) {
        if (typeof id === 'string') {
            return parseInt(id, 10);
        }
        return Number(id);
    }
    async ensureNovosBoard(tipo, currentUser, agenteId, colaboradorId, tipoFluxo) {
        let usuarioIdDono;
        let agenteIdForBoard = null;
        let colaboradorIdForBoard = null;
        if (tipo === kanban_board_entity_1.KanbanBoardType.ADMIN) {
            usuarioIdDono = this.normalizeId(currentUser.id);
        }
        else if (tipo === kanban_board_entity_1.KanbanBoardType.AGENTE) {
            if (currentUser.perfil === user_entity_1.UserProfile.ADMIN && agenteId) {
                usuarioIdDono = agenteId;
                agenteIdForBoard = agenteId;
            }
            else {
                usuarioIdDono = this.normalizeId(currentUser.id);
                agenteIdForBoard = this.normalizeId(currentUser.id);
            }
        }
        else if (tipo === kanban_board_entity_1.KanbanBoardType.COLABORADOR) {
            if (colaboradorId) {
                usuarioIdDono = colaboradorId;
                colaboradorIdForBoard = colaboradorId;
            }
            else {
                usuarioIdDono = this.normalizeId(currentUser.id);
                colaboradorIdForBoard = this.normalizeId(currentUser.id);
            }
        }
        else {
            throw new common_1.BadRequestException('Tipo de board inválido');
        }
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
    async findAll(filterDto, currentUser) {
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
            queryBuilder.andWhere((0, pg_unaccent_search_1.pgWhereUnaccentContains)('COALESCE(board.nome, \'\')', 'nomeBoard'), {
                nomeBoard: `%${filterDto.nome.trim()}%`,
            });
        }
        if (filterDto.tipo_fluxo) {
            queryBuilder.leftJoin('kanban_modelo', 'modelo', 'modelo.kanban_modelo_id = board.kanban_modelo_id');
            if (filterDto.tipo_fluxo === 'COMPRADOR') {
                queryBuilder.andWhere(`(
            board.tipo_fluxo = :tipo_fluxo 
            OR board.tipo_fluxo IS NULL
            OR modelo.tipo_fluxo = :tipo_fluxo
          )`, { tipo_fluxo: filterDto.tipo_fluxo });
            }
            else {
                queryBuilder.andWhere(`(
            board.tipo_fluxo = :tipo_fluxo 
            OR modelo.tipo_fluxo = :tipo_fluxo
          )`, { tipo_fluxo: filterDto.tipo_fluxo });
            }
        }
        queryBuilder.orderBy('board.ordem', 'ASC');
        queryBuilder.leftJoinAndSelect('board.kanbanStatus', 'kanbanStatus');
        const boards = await queryBuilder.getMany();
        const boardsWithCounts = await Promise.all(boards.map(async (board) => {
            const count = await this.getLeadsCountByBoard(board);
            return {
                ...board,
                cor_hex: board.cor_hex,
                leads_count: count,
            };
        }));
        return boardsWithCounts;
    }
    async findOne(id) {
        const board = await this.kanbanBoardRepository.findOne({
            where: { id },
        });
        if (!board) {
            throw new common_1.NotFoundException('Board não encontrado');
        }
        return board;
    }
    async create(createKanbanBoardDto, currentUser) {
        if (createKanbanBoardDto.tipo === kanban_board_entity_1.KanbanBoardType.AGENTE) {
            if (!createKanbanBoardDto.colaborador_id) {
                throw new common_1.BadRequestException('colaborador_id é obrigatório para boards do tipo AGENTE');
            }
            if (!createKanbanBoardDto.kanban_modelo_id) {
                throw new common_1.BadRequestException('kanban_modelo_id é obrigatório para boards do tipo AGENTE');
            }
            let agenteId = createKanbanBoardDto.agente_id;
            if (!agenteId) {
                if (currentUser.perfil === user_entity_1.UserProfile.AGENTE) {
                    agenteId = this.normalizeId(currentUser.id);
                }
                else {
                    throw new common_1.BadRequestException('agente_id é obrigatório para boards do tipo AGENTE');
                }
            }
            const existingBoard = await this.kanbanBoardRepository.findOne({
                where: {
                    colaborador_id: createKanbanBoardDto.colaborador_id,
                    tipo: kanban_board_entity_1.KanbanBoardType.AGENTE,
                    active: true,
                },
            });
            if (existingBoard) {
                throw new common_1.BadRequestException('Colaborador já possui um board. Cada colaborador pode ter apenas 1 board.');
            }
            let tipoFluxo = createKanbanBoardDto.tipo_fluxo;
            if (!tipoFluxo && createKanbanBoardDto.kanban_modelo_id) {
                const modelo = await this.kanbanModeloRepository.findOne({
                    where: { kanban_modelo_id: createKanbanBoardDto.kanban_modelo_id },
                });
                tipoFluxo = modelo?.tipo_fluxo || null;
            }
            if (!tipoFluxo) {
                tipoFluxo = 'COMPRADOR';
            }
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
                const savedBoard = await queryRunner.manager.save(kanban_board_entity_1.KanbanBoard, board);
                if (savedBoard.tipo === kanban_board_entity_1.KanbanBoardType.AGENTE &&
                    savedBoard.colaborador_id &&
                    savedBoard.kanban_modelo_id) {
                    await this.createAutomaticBoardsForColaborador(savedBoard, queryRunner);
                }
                await queryRunner.commitTransaction();
                return savedBoard;
            }
            catch (error) {
                await queryRunner.rollbackTransaction();
                throw new common_1.BadRequestException(`Erro ao criar board e boards automáticos: ${error.message || 'Erro desconhecido'}`);
            }
            finally {
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
        if (!tipoFluxo) {
            tipoFluxo = 'COMPRADOR';
        }
        const board = this.kanbanBoardRepository.create({
            ...createKanbanBoardDto,
            tipo_fluxo: tipoFluxo,
            id_usuario_created_at: this.normalizeId(currentUser.id),
            ordem: createKanbanBoardDto.ordem ?? 0,
        });
        return await this.kanbanBoardRepository.save(board);
    }
    async createAutomaticBoardsForColaborador(boardAgente, queryRunner) {
        const modelo = await this.kanbanModeloRepository.findOne({
            where: { kanban_modelo_id: boardAgente.kanban_modelo_id },
        });
        const tipoFluxo = boardAgente.tipo_fluxo ||
            modelo?.tipo_fluxo ||
            TipoFluxo.COMPRADOR;
        const existingNovos = await queryRunner.manager.findOne(kanban_board_entity_1.KanbanBoard, {
            where: {
                nome: 'NOVOS',
                tipo: kanban_board_entity_1.KanbanBoardType.COLABORADOR,
                colaborador_id: boardAgente.colaborador_id,
                tipo_fluxo: tipoFluxo,
                active: true,
            },
        });
        if (!existingNovos) {
            const novosBoard = queryRunner.manager.create(kanban_board_entity_1.KanbanBoard, {
                nome: 'NOVOS',
                cor_hex: '#C6DCFF',
                usuario_id_dono: boardAgente.colaborador_id,
                colaborador_id: boardAgente.colaborador_id,
                kanban_modelo_id: null,
                ordem: 0,
                tipo: kanban_board_entity_1.KanbanBoardType.COLABORADOR,
                kanban_status_id: null,
                id_usuario_created_at: boardAgente.id_usuario_created_at,
                tipo_fluxo: tipoFluxo,
                active: true,
            });
            await queryRunner.manager.save(kanban_board_entity_1.KanbanBoard, novosBoard);
        }
        const modeloStatuses = await this.kanbanModeloStatusRepository.find({
            where: { kanban_modelo_id: boardAgente.kanban_modelo_id },
            relations: ['kanbanStatus'],
        });
        let ordem = 1;
        for (const modeloStatus of modeloStatuses) {
            if (modeloStatus.kanbanStatus && modeloStatus.kanbanStatus.active) {
                const statusBoard = queryRunner.manager.create(kanban_board_entity_1.KanbanBoard, {
                    nome: modeloStatus.kanbanStatus.descricao,
                    cor_hex: modeloStatus.kanbanStatus.bg_color || boardAgente.cor_hex,
                    usuario_id_dono: boardAgente.colaborador_id,
                    colaborador_id: boardAgente.colaborador_id,
                    kanban_modelo_id: boardAgente.kanban_modelo_id,
                    ordem: ordem++,
                    tipo: kanban_board_entity_1.KanbanBoardType.COLABORADOR,
                    kanban_status_id: modeloStatus.kanbanStatus.kanban_status_id,
                    id_usuario_created_at: boardAgente.id_usuario_created_at,
                    tipo_fluxo: tipoFluxo,
                    active: true,
                });
                await queryRunner.manager.save(kanban_board_entity_1.KanbanBoard, statusBoard);
            }
        }
    }
    async update(id, updateKanbanBoardDto, currentUser) {
        const board = await this.findOne(id);
        Object.assign(board, updateKanbanBoardDto);
        return await this.kanbanBoardRepository.save(board);
    }
    async remove(id, currentUser) {
        const board = await this.findOne(id);
        const count = await this.getLeadsCountByBoard(board);
        if (count > 0) {
            throw new common_1.BadRequestException('Não é possível excluir um board que contém leads');
        }
        board.active = false;
        await this.kanbanBoardRepository.save(board);
    }
    getBoardType(board) {
        if (board.nome === 'NOVOS') {
            return 'NOVO';
        }
        if (board.tipo === kanban_board_entity_1.KanbanBoardType.COLABORADOR && board.kanban_status_id) {
            return 'STATUS';
        }
        if ((board.tipo === kanban_board_entity_1.KanbanBoardType.COLABORADOR || board.tipo === kanban_board_entity_1.KanbanBoardType.AGENTE) && board.colaborador_id) {
            return 'COLABORADOR';
        }
        if ((board.tipo === kanban_board_entity_1.KanbanBoardType.AGENTE || board.tipo === kanban_board_entity_1.KanbanBoardType.ADMIN) && board.agente_id) {
            return 'AGENTE';
        }
        return 'NOVO';
    }
    async getTipoFluxo(board) {
        if (board.tipo_fluxo) {
            return board.tipo_fluxo;
        }
        if (board.kanban_modelo_id) {
            const modelo = await this.kanbanModeloRepository.findOne({
                where: { kanban_modelo_id: board.kanban_modelo_id },
            });
            if (modelo?.tipo_fluxo) {
                return modelo.tipo_fluxo;
            }
        }
        return 'COMPRADOR';
    }
    async findLeadKanbanStatus(queryRunner, leadId, tipoFluxo) {
        const result = await queryRunner.manager.query(`SELECT * FROM lead_kanban_status 
       WHERE lead_id = $1 AND tipo_fluxo = $2`, [leadId, tipoFluxo]);
        return result.length > 0 ? result[0] : null;
    }
    async createUserOccurrence(queryRunner, leadId, texto, currentUser) {
        const occurrence = queryRunner.manager.create(occurrence_entity_1.Occurrence, {
            leads_id: leadId,
            texto,
            tipo: occurrence_entity_1.OccurrenceType.USUARIO,
            usuarios_id: this.normalizeId(currentUser.id),
        });
        await queryRunner.manager.save(occurrence_entity_1.Occurrence, occurrence);
    }
    async createLeadInBoard(boardId, createLeadDto, currentUser) {
        const board = await this.findOne(boardId);
        if (!board) {
            throw new common_1.NotFoundException('Board não encontrado');
        }
        if (!board.active) {
            throw new common_1.BadRequestException('Board deve estar ativo');
        }
        const boardType = this.getBoardType(board);
        const tipoFluxo = await this.getTipoFluxo(board);
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
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const newLead = queryRunner.manager.create(lead_entity_1.Lead, {
                ...leadData,
                data_entrada: createLeadDto.data_entrada ? new Date(createLeadDto.data_entrada) : new Date(),
            });
            const savedLead = await queryRunner.manager.save(lead_entity_1.Lead, newLead);
            if (produtos && produtos.length > 0) {
                const produtosExistentes = await this.produtoRepository.find({
                    where: produtos.map(id => ({ produto_id: id })),
                });
                const produtosExistentesIds = produtosExistentes.map(p => p.produto_id);
                const produtosInvalidos = produtos.filter(id => !produtosExistentesIds.includes(id));
                if (produtosInvalidos.length > 0) {
                    throw new common_1.BadRequestException(`Produtos inválidos: ${produtosInvalidos.join(', ')}`);
                }
                for (const produtoId of produtos) {
                    const leadsProduto = queryRunner.manager.create(leads_produto_entity_1.LeadsProduto, {
                        leads_id: savedLead.id,
                        produto_id: produtoId,
                    });
                    await queryRunner.manager.save(leads_produto_entity_1.LeadsProduto, leadsProduto);
                }
            }
            let vendedorId = null;
            let usuarioIdColaborador = null;
            let kanbanStatusId = null;
            if (board.tipo === kanban_board_entity_1.KanbanBoardType.ADMIN) {
                if (boardType === 'NOVO') {
                    vendedorId = null;
                    usuarioIdColaborador = null;
                    kanbanStatusId = null;
                }
                else if (boardType === 'AGENTE') {
                    vendedorId = board.agente_id;
                    usuarioIdColaborador = null;
                    kanbanStatusId = null;
                }
            }
            else if (board.tipo === kanban_board_entity_1.KanbanBoardType.AGENTE) {
                if (boardType === 'NOVO') {
                    vendedorId = board.agente_id;
                    usuarioIdColaborador = null;
                    kanbanStatusId = null;
                }
                else if (boardType === 'COLABORADOR') {
                    vendedorId = board.agente_id;
                    usuarioIdColaborador = board.colaborador_id;
                    kanbanStatusId = null;
                }
            }
            else if (board.tipo === kanban_board_entity_1.KanbanBoardType.COLABORADOR) {
                if (boardType === 'NOVO') {
                    if (!board.agente_id) {
                        throw new common_1.BadRequestException('Board "NOVOS" na tela kanban-colaborador deve ter agente_id definido (agente pai do colaborador)');
                    }
                    vendedorId = board.agente_id;
                    usuarioIdColaborador = board.colaborador_id;
                    kanbanStatusId = null;
                }
                else if (boardType === 'STATUS') {
                    vendedorId = board.agente_id;
                    usuarioIdColaborador = board.colaborador_id;
                    kanbanStatusId = board.kanban_status_id;
                }
            }
            await queryRunner.manager.query(`INSERT INTO lead_kanban_status 
         (lead_id, tipo_fluxo, vendedor_id, usuario_id_colaborador, kanban_status_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`, [savedLead.id, tipoFluxo, vendedorId, usuarioIdColaborador, kanbanStatusId]);
            await queryRunner.commitTransaction();
            const lead = await this.leadsRepository.findOne({
                where: { id: savedLead.id },
                relations: ['vendedor', 'colaborador'],
            });
            const leadsProdutos = await this.leadsProdutoRepository.find({
                where: { leads_id: savedLead.id },
                relations: ['produto', 'produto.produto_tipo'],
            });
            lead.produtos = leadsProdutos.map(lp => lp.produto);
            return lead;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async moveLead(leadId, fromBoardId, toBoardId, currentUser) {
        const lead = await this.leadsRepository.findOne({
            where: { id: leadId },
        });
        if (!lead) {
            throw new common_1.NotFoundException('Lead não encontrado');
        }
        const fromBoard = await this.findOne(fromBoardId);
        const toBoard = await this.findOne(toBoardId);
        if (!fromBoard.active || !toBoard.active) {
            throw new common_1.BadRequestException('Boards devem estar ativos');
        }
        if (fromBoardId === toBoardId) {
            throw new common_1.BadRequestException('Não é possível mover para o mesmo board');
        }
        const fromBoardType = this.getBoardType(fromBoard);
        const toBoardType = this.getBoardType(toBoard);
        const tipoFluxo = await this.getTipoFluxo(toBoard);
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const currentLks = await this.findLeadKanbanStatus(queryRunner, leadId, tipoFluxo);
            if (!currentLks && fromBoardType !== 'NOVO') {
                throw new common_1.BadRequestException('Registro de lead_kanban_status não encontrado');
            }
            if (fromBoard.tipo === kanban_board_entity_1.KanbanBoardType.ADMIN) {
                if (fromBoardType === 'NOVO' && toBoardType === 'AGENTE') {
                    if (!toBoard.agente_id) {
                        throw new common_1.BadRequestException('Board destino não possui agente_id');
                    }
                    if (currentLks) {
                        await queryRunner.manager.query(`UPDATE lead_kanban_status 
               SET vendedor_id = $1, usuario_id_colaborador = NULL, kanban_status_id = NULL, updated_at = NOW()
               WHERE lead_id = $2 AND tipo_fluxo = $3`, [toBoard.agente_id, leadId, tipoFluxo]);
                    }
                    else {
                        await queryRunner.manager.query(`INSERT INTO lead_kanban_status 
               (lead_id, tipo_fluxo, vendedor_id, usuario_id_colaborador, kanban_status_id, created_at, updated_at)
               VALUES ($1, $2, $3, NULL, NULL, NOW(), NOW())`, [leadId, tipoFluxo, toBoard.agente_id]);
                    }
                }
                else if (fromBoardType === 'AGENTE' && toBoardType === 'NOVO') {
                    await queryRunner.manager.query(`UPDATE lead_kanban_status 
             SET vendedor_id = NULL, usuario_id_colaborador = NULL, kanban_status_id = NULL, updated_at = NOW()
             WHERE lead_id = $1 AND tipo_fluxo = $2`, [leadId, tipoFluxo]);
                }
                else if (fromBoardType === 'AGENTE' && toBoardType === 'AGENTE') {
                    await queryRunner.manager.query(`UPDATE lead_kanban_status 
             SET vendedor_id = $1, usuario_id_colaborador = NULL, kanban_status_id = NULL, updated_at = NOW()
             WHERE lead_id = $2 AND tipo_fluxo = $3`, [toBoard.agente_id, leadId, tipoFluxo]);
                }
                else {
                    throw new common_1.BadRequestException('Movimentação inválida para Kanban-admin');
                }
            }
            else if (fromBoard.tipo === kanban_board_entity_1.KanbanBoardType.AGENTE) {
                if (fromBoardType === 'NOVO' && toBoardType === 'COLABORADOR') {
                    if (!toBoard.colaborador_id) {
                        throw new common_1.BadRequestException('Board destino não possui colaborador_id');
                    }
                    await queryRunner.manager.query(`UPDATE lead_kanban_status 
             SET usuario_id_colaborador = $1, kanban_status_id = NULL, updated_at = NOW()
             WHERE lead_id = $2 AND tipo_fluxo = $3`, [toBoard.colaborador_id, leadId, tipoFluxo]);
                }
                else if (fromBoardType === 'COLABORADOR' && toBoardType === 'NOVO') {
                    await queryRunner.manager.query(`UPDATE lead_kanban_status 
             SET usuario_id_colaborador = NULL, kanban_status_id = NULL, updated_at = NOW()
             WHERE lead_id = $1 AND tipo_fluxo = $2`, [leadId, tipoFluxo]);
                }
                else if (fromBoardType === 'COLABORADOR' && toBoardType === 'COLABORADOR') {
                    if (!toBoard.colaborador_id) {
                        throw new common_1.BadRequestException('Board destino não possui colaborador_id');
                    }
                    await queryRunner.manager.query(`UPDATE lead_kanban_status 
             SET usuario_id_colaborador = $1, kanban_status_id = NULL, updated_at = NOW()
             WHERE lead_id = $2 AND tipo_fluxo = $3`, [toBoard.colaborador_id, leadId, tipoFluxo]);
                }
                else {
                    throw new common_1.BadRequestException('Movimentação inválida para Kanban-agente');
                }
            }
            else if (fromBoard.tipo === kanban_board_entity_1.KanbanBoardType.COLABORADOR) {
                if (fromBoardType === 'NOVO' && toBoardType === 'STATUS') {
                    if (!toBoard.kanban_status_id) {
                        throw new common_1.BadRequestException('Board destino não possui kanban_status_id');
                    }
                    await queryRunner.manager.query(`UPDATE lead_kanban_status 
             SET kanban_status_id = $1, updated_at = NOW()
             WHERE lead_id = $2 AND tipo_fluxo = $3`, [toBoard.kanban_status_id, leadId, tipoFluxo]);
                }
                else if (fromBoardType === 'STATUS' && toBoardType === 'NOVO') {
                    await queryRunner.manager.query(`UPDATE lead_kanban_status 
             SET kanban_status_id = NULL, updated_at = NOW()
             WHERE lead_id = $1 AND tipo_fluxo = $2`, [leadId, tipoFluxo]);
                }
                else if (fromBoardType === 'STATUS' && toBoardType === 'STATUS') {
                    if (!toBoard.kanban_status_id) {
                        throw new common_1.BadRequestException('Board destino não possui kanban_status_id');
                    }
                    await queryRunner.manager.query(`UPDATE lead_kanban_status 
             SET kanban_status_id = $1, updated_at = NOW()
             WHERE lead_id = $2 AND tipo_fluxo = $3`, [toBoard.kanban_status_id, leadId, tipoFluxo]);
                }
                else {
                    throw new common_1.BadRequestException('Movimentação inválida para Kanban-colaborador');
                }
            }
            else {
                throw new common_1.BadRequestException('Tipo de board origem inválido');
            }
            const textoOcorrencia = `Lead movido de "${fromBoard.nome}" para "${toBoard.nome}"`;
            await this.createUserOccurrence(queryRunner, leadId, textoOcorrencia, currentUser);
            await queryRunner.commitTransaction();
            return await this.leadsRepository.findOne({
                where: { id: leadId },
            });
        }
        catch (error) {
            try {
                await queryRunner.rollbackTransaction();
            }
            catch (rollbackError) {
                if (rollbackError?.message?.includes('Transaction is not started')) {
                }
                else {
                    console.error('Erro ao fazer rollback:', rollbackError);
                }
            }
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async createSystemOccurrence(leadId, texto, currentUser, tipoFluxo) {
        const userId = this.normalizeId(currentUser.id);
        const occurrence = this.occurrencesRepository.create({
            leads_id: leadId,
            usuarios_id: userId,
            texto,
            tipo: occurrence_entity_1.OccurrenceType.SISTEMA,
            tipo_fluxo: tipoFluxo || null,
        });
        return await this.occurrencesRepository.save(occurrence);
    }
    async getLeadsByBoard(boardId, filterDto, currentUser) {
        try {
            const board = await this.findOne(boardId);
            const page = filterDto.page || 1;
            const limit = filterDto.limit || 50;
            let tipoFluxo = board.tipo_fluxo || TipoFluxo.COMPRADOR;
            if (!board.tipo_fluxo && board.kanban_modelo_id) {
                const modelo = await this.kanbanModeloRepository.findOne({
                    where: { kanban_modelo_id: board.kanban_modelo_id },
                });
                if (modelo?.tipo_fluxo) {
                    tipoFluxo = modelo.tipo_fluxo;
                }
            }
            const tipoFluxoString = typeof tipoFluxo === 'string' ? tipoFluxo : String(tipoFluxo);
            const tipoFluxoClean = tipoFluxoString.replace(/[{}]/g, '').trim();
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
            if (board.tipo === kanban_board_entity_1.KanbanBoardType.ADMIN) {
                if (board.nome === 'NOVOS') {
                    const tipoFluxoEscaped = tipoFluxoClean.replace(/'/g, "''");
                    queryBuilder.leftJoin('lead_kanban_status', 'lks', `lks.lead_id = lead.id AND lks.tipo_fluxo = '${tipoFluxoEscaped}'`);
                    queryBuilder.andWhere('(lks.lead_id IS NULL OR lks.vendedor_id IS NULL)');
                    console.log('[getLeadsByBoard] Filtro ADMIN NOVOS: leads sem registro OU com vendedor_id IS NULL');
                }
                else {
                    console.log(`[getLeadsByBoard] Passando tipo_fluxo para INNER JOIN:`, {
                        valor: tipoFluxoClean,
                        tipo: typeof tipoFluxoClean,
                        JSON: JSON.stringify(tipoFluxoClean),
                        length: tipoFluxoClean.length
                    });
                    const tipoFluxoEscaped = tipoFluxoClean.replace(/'/g, "''");
                    queryBuilder.innerJoin('lead_kanban_status', 'lks', `lks.lead_id = lead.id AND lks.tipo_fluxo = '${tipoFluxoEscaped}'`);
                    if (board.agente_id) {
                        const agenteId = this.normalizeId(board.agente_id);
                        queryBuilder.andWhere('lks.vendedor_id = :agente_id', {
                            agente_id: agenteId,
                        });
                        console.log('[getLeadsByBoard] Filtro aplicado: lks.vendedor_id =', agenteId);
                    }
                    else {
                        console.warn('[getLeadsByBoard] Board ADMIN sem agente_id:', board.id, board.nome);
                    }
                }
            }
            else if (board.tipo === kanban_board_entity_1.KanbanBoardType.AGENTE) {
                queryBuilder.innerJoin('lead_kanban_status', 'lks', 'lks.lead_id = lead.id AND lks.tipo_fluxo = :tipo_fluxo', { tipo_fluxo: tipoFluxoClean });
                if (board.nome === 'NOVOS') {
                    if (board.agente_id) {
                        queryBuilder.andWhere('lks.vendedor_id = :agente_id', {
                            agente_id: board.agente_id,
                        });
                        queryBuilder.andWhere('lks.usuario_id_colaborador IS NULL');
                        console.log('[getLeadsByBoard] Filtro AGENTE NOVOS: lks.vendedor_id =', board.agente_id, 'AND lks.usuario_id_colaborador IS NULL');
                    }
                }
                else {
                    if (board.colaborador_id) {
                        queryBuilder.andWhere('lks.usuario_id_colaborador = :colaborador_id', {
                            colaborador_id: board.colaborador_id,
                        });
                        console.log('[getLeadsByBoard] Filtro AGENTE Colaborador: lks.usuario_id_colaborador =', board.colaborador_id);
                    }
                }
            }
            else if (board.tipo === kanban_board_entity_1.KanbanBoardType.COLABORADOR) {
                const tipoFluxoEscaped = tipoFluxoClean.replace(/'/g, "''");
                queryBuilder.innerJoin('lead_kanban_status', 'lks', `lks.lead_id = lead.id AND lks.tipo_fluxo = '${tipoFluxoEscaped}'`);
                if (board.nome === 'NOVOS') {
                    if (board.colaborador_id) {
                        queryBuilder.andWhere('lks.usuario_id_colaborador = :colaborador_id', {
                            colaborador_id: board.colaborador_id,
                        });
                        queryBuilder.andWhere('lks.kanban_status_id IS NULL');
                        console.log('[getLeadsByBoard] Filtro COLABORADOR NOVOS: lks.usuario_id_colaborador =', board.colaborador_id, 'AND lks.kanban_status_id IS NULL, tipo_fluxo =', tipoFluxoClean);
                    }
                }
                else {
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
            if (board.tipo === kanban_board_entity_1.KanbanBoardType.ADMIN) {
                queryBuilder.andWhere(':tipoFluxo = ANY(lead.tipo_lead)', { tipoFluxo: tipoFluxoClean });
                console.log('[getLeadsByBoard] Filtro tipo_lead aplicado para ADMIN:', tipoFluxoClean);
            }
            if (filterDto.nome_razao_social) {
                queryBuilder.andWhere(`(${(0, pg_unaccent_search_1.pgWhereUnaccentContains)(`COALESCE(lead.nome_razao_social, '')`, 'nome')} OR ${(0, pg_unaccent_search_1.pgWhereUnaccentContains)(`COALESCE(lead.nome_fantasia_apelido, '')`, 'nome')})`, { nome: `%${filterDto.nome_razao_social.trim()}%` });
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
                if (board.tipo === kanban_board_entity_1.KanbanBoardType.ADMIN && board.nome === 'NOVOS') {
                    queryBuilder.andWhere('lks.lead_id IS NOT NULL AND lks.vendedor_id = :vendedorId', { vendedorId });
                }
                else {
                    queryBuilder.andWhere('lks.vendedor_id = :vendedorId', { vendedorId });
                }
            }
            if (filterDto.usuario_id_colaborador) {
                if (currentUser.perfil === user_entity_1.UserProfile.AGENTE) {
                    const colaborador = await this.usersRepository.findOne({
                        where: { id: filterDto.usuario_id_colaborador },
                    });
                    const currentUserId = this.normalizeId(currentUser.id);
                    const colaboradorPaiId = colaborador?.usuario_id_pai ? this.normalizeId(colaborador.usuario_id_pai) : null;
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
                if (board.tipo === kanban_board_entity_1.KanbanBoardType.ADMIN && board.nome === 'NOVOS') {
                    queryBuilder.andWhere('lks.lead_id IS NOT NULL AND lks.usuario_id_colaborador = :colaboradorId', {
                        colaboradorId
                    });
                }
                else {
                    queryBuilder.andWhere('lks.usuario_id_colaborador = :colaboradorId', {
                        colaboradorId
                    });
                }
            }
            if (filterDto.origem_lead) {
                queryBuilder.andWhere('lead.origem_lead = :origemLead', { origemLead: filterDto.origem_lead });
            }
            if (filterDto.produtos && filterDto.produtos.length > 0) {
                queryBuilder.andWhere(`EXISTS (SELECT 1 FROM leads_produto WHERE leads_produto.leads_id = lead.id AND leads_produto.produto_id IN (:...produtoIds))`, {
                    produtoIds: filterDto.produtos,
                });
            }
            queryBuilder.orderBy('lead.created_at', 'DESC');
            const paramsBefore = queryBuilder.getParameters();
            const normalizedParams = {};
            Object.keys(paramsBefore).forEach(key => {
                const value = paramsBefore[key];
                if (value && typeof value === 'object' && value.constructor && value.constructor.name !== 'Array') {
                    normalizedParams[key] = String(value);
                }
                else if (Array.isArray(value)) {
                    normalizedParams[key] = value.map(v => String(v));
                }
                else {
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
            let debugSql = sql;
            Object.keys(params).forEach(key => {
                const value = params[key];
                const regex = new RegExp(`:${key}\\b`, 'g');
                const stringValue = String(value);
                if (typeof value === 'string' || (value && value.constructor && value.constructor.name === 'String')) {
                    debugSql = debugSql.replace(regex, `'${stringValue.replace(/'/g, "''")}'`);
                }
                else if (value === null || value === undefined) {
                    debugSql = debugSql.replace(regex, 'NULL');
                }
                else if (Array.isArray(value)) {
                    debugSql = debugSql.replace(regex, `(${value.map(v => {
                        const vStr = String(v);
                        return typeof v === 'string' ? `'${vStr.replace(/'/g, "''")}'` : vStr;
                    }).join(', ')})`);
                }
                else {
                    debugSql = debugSql.replace(regex, `'${stringValue.replace(/'/g, "''")}'`);
                }
            });
            console.log('[getLeadsByBoard] SQL Query PRONTA PARA TESTAR (com parâmetros substituídos):');
            console.log('---');
            console.log(debugSql);
            console.log('---');
            console.log(`[getLeadsByBoard] ========== FIM SQL QUERY BOARD ${boardId} ==========`);
            const sqlForResponse = debugSql;
            const sqlRawForResponse = sql;
            const paramsForResponse = { ...params };
            const total = await queryBuilder.getCount();
            console.log('[getLeadsByBoard] Total de leads encontrados:', total);
            const skip = (page - 1) * limit;
            queryBuilder.skip(skip).take(limit);
            const leads = await queryBuilder.getMany();
            console.log('[getLeadsByBoard] Leads retornados:', leads.length);
            if (leads.length > 0) {
                const leadIds = leads.map(lead => lead.id);
                const preCheckQueryBuilder = this.leadsRepository.manager
                    .createQueryBuilder()
                    .select('COUNT(*)', 'count')
                    .from('lead_kanban_status', 'lks')
                    .where('lks.lead_id IN (:...leadIds)', { leadIds })
                    .andWhere(`lks.tipo_fluxo = '${tipoFluxoClean.replace(/'/g, "''")}'`);
                const preCheckResult = await preCheckQueryBuilder.getRawOne();
                console.log('[getLeadsByBoard] Pre-query check lead_kanban_status - Total de registros:', preCheckResult?.count || 0);
                try {
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
                    const lksPorLead = new Map();
                    lksRecords.forEach((lks) => {
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
                    leads.forEach(lead => {
                        const lks = lksPorLead.get(lead.id);
                        if (lks) {
                            lead.vendedor = lks.vendedor;
                            lead.colaborador = lks.colaborador;
                            lead.kanbanStatus = lks.kanbanStatus;
                        }
                    });
                }
                catch (lksError) {
                    console.error('[getLeadsByBoard] Erro ao carregar relações de lead_kanban_status:', lksError);
                }
            }
            if (leads.length > 0) {
                const leadIds = leads.map(lead => lead.id);
                const leadsProdutos = await this.leadsProdutoRepository.find({
                    where: { leads_id: (0, typeorm_2.In)(leadIds) },
                    relations: ['produto', 'produto.produto_tipo'],
                });
                const produtosPorLead = new Map();
                leadsProdutos.forEach(lp => {
                    if (!produtosPorLead.has(lp.leads_id)) {
                        produtosPorLead.set(lp.leads_id, new Map());
                    }
                    const produtosMap = produtosPorLead.get(lp.leads_id);
                    if (!produtosMap.has(lp.produto.produto_id)) {
                        if (!lp.produto.produto_tipo) {
                            console.warn(`[getLeadsByBoard] Produto ${lp.produto.produto_id} (${lp.produto.descricao}) não tem produto_tipo carregado`);
                        }
                        else if (!lp.produto.produto_tipo.bg_color) {
                            console.warn(`[getLeadsByBoard] Produto ${lp.produto.produto_id} (${lp.produto.descricao}) tem produto_tipo mas bg_color está vazio/null`);
                        }
                        produtosMap.set(lp.produto.produto_id, lp.produto);
                    }
                });
                leads.forEach(lead => {
                    const produtosMap = produtosPorLead.get(lead.id);
                    lead.produtos = produtosMap ? Array.from(produtosMap.values()) : [];
                });
            }
            if (leads.length > 0) {
                const leadIds = leads.map(lead => lead.id);
                try {
                    const lastOccurrences = await this.occurrencesRepository
                        .createQueryBuilder('occ')
                        .select('occ.leads_id', 'lead_id')
                        .addSelect('MAX(occ.created_at)', 'last_occurrence_date')
                        .where('occ.leads_id IN (:...leadIds)', { leadIds })
                        .groupBy('occ.leads_id')
                        .getRawMany();
                    const occurrencesMap = new Map();
                    lastOccurrences.forEach((occ) => {
                        occurrencesMap.set(occ.lead_id, occ.last_occurrence_date);
                    });
                    leads.forEach(lead => {
                        lead.ultima_ocorrencia_date = occurrencesMap.get(lead.id) || null;
                    });
                }
                catch (error) {
                    console.error('[getLeadsByBoard] Erro ao carregar últimas ocorrências:', error);
                    leads.forEach(lead => {
                        lead.ultima_ocorrencia_date = null;
                    });
                }
            }
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
                sql: sqlForResponse,
                sqlRaw: sqlRawForResponse,
                params: paramsForResponse,
            };
        }
        catch (error) {
            console.error('[getLeadsByBoard] Erro ao buscar leads:', error);
            console.error('[getLeadsByBoard] Stack:', error.stack);
            console.error('[getLeadsByBoard] Error message:', error.message);
            if (error instanceof Error) {
                console.error('[getLeadsByBoard] Error name:', error.name);
            }
            throw new common_1.BadRequestException(`Erro ao buscar leads: ${error.message || 'Erro desconhecido'}`);
        }
    }
    async getLeadsCountByBoard(board) {
        const queryBuilder = this.leadsRepository.createQueryBuilder('lead');
        let tipoFluxo = board.tipo_fluxo || TipoFluxo.COMPRADOR;
        if (!board.tipo_fluxo && board.kanban_modelo_id) {
            const modelo = await this.kanbanModeloRepository.findOne({
                where: { kanban_modelo_id: board.kanban_modelo_id },
            });
            if (modelo?.tipo_fluxo) {
                tipoFluxo = modelo.tipo_fluxo;
            }
        }
        const tipoFluxoString = typeof tipoFluxo === 'string' ? tipoFluxo : String(tipoFluxo);
        const tipoFluxoClean = tipoFluxoString.replace(/[{}]/g, '').trim();
        const tipoFluxoEscaped = tipoFluxoClean.replace(/'/g, "''");
        queryBuilder.innerJoin('lead_kanban_status', 'lks', 'lks.lead_id = lead.id');
        queryBuilder.andWhere(`lks.tipo_fluxo = '${tipoFluxoEscaped}'`);
        if (board.tipo === kanban_board_entity_1.KanbanBoardType.ADMIN) {
            if (board.nome === 'NOVOS') {
                queryBuilder.andWhere('lks.vendedor_id IS NULL');
            }
            else {
                queryBuilder.andWhere('lks.vendedor_id = :agente_id', {
                    agente_id: board.agente_id,
                });
            }
        }
        else if (board.tipo === kanban_board_entity_1.KanbanBoardType.AGENTE) {
            if (board.nome === 'NOVOS') {
                queryBuilder.andWhere('lks.vendedor_id = :agente_id', {
                    agente_id: board.agente_id,
                });
                queryBuilder.andWhere('lks.usuario_id_colaborador IS NULL');
            }
            else {
                queryBuilder.andWhere('lks.usuario_id_colaborador = :colaborador_id', {
                    colaborador_id: board.colaborador_id,
                });
            }
        }
        else if (board.tipo === kanban_board_entity_1.KanbanBoardType.COLABORADOR) {
            if (board.nome === 'NOVOS') {
                queryBuilder.andWhere('lks.usuario_id_colaborador = :colaborador_id', {
                    colaborador_id: board.colaborador_id,
                });
                queryBuilder.andWhere('lks.kanban_status_id IS NULL');
            }
            else {
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
    async exportLeadsByBoard(boardId, filterDto, currentUser) {
        try {
            const board = await this.findOne(boardId);
            let tipoFluxo = board.tipo_fluxo || TipoFluxo.COMPRADOR;
            if (!board.tipo_fluxo && board.kanban_modelo_id) {
                const modelo = await this.kanbanModeloRepository.findOne({
                    where: { kanban_modelo_id: board.kanban_modelo_id },
                });
                if (modelo?.tipo_fluxo) {
                    tipoFluxo = modelo.tipo_fluxo;
                }
            }
            const tipoFluxoString = typeof tipoFluxo === 'string' ? tipoFluxo : String(tipoFluxo);
            const tipoFluxoClean = tipoFluxoString.replace(/[{}]/g, '').trim();
            const queryBuilder = this.leadsRepository.createQueryBuilder('lead');
            if (board.tipo === kanban_board_entity_1.KanbanBoardType.ADMIN) {
                if (board.nome === 'NOVOS') {
                    const tipoFluxoEscaped = tipoFluxoClean.replace(/'/g, "''");
                    queryBuilder.leftJoin('lead_kanban_status', 'lks', `lks.lead_id = lead.id AND lks.tipo_fluxo = '${tipoFluxoEscaped}'`);
                    queryBuilder.andWhere('(lks.lead_id IS NULL OR lks.vendedor_id IS NULL)');
                }
                else {
                    const tipoFluxoEscaped = tipoFluxoClean.replace(/'/g, "''");
                    queryBuilder.innerJoin('lead_kanban_status', 'lks', `lks.lead_id = lead.id AND lks.tipo_fluxo = '${tipoFluxoEscaped}'`);
                    if (board.agente_id) {
                        const agenteId = this.normalizeId(board.agente_id);
                        queryBuilder.andWhere('lks.vendedor_id = :agente_id', {
                            agente_id: agenteId,
                        });
                    }
                }
            }
            else if (board.tipo === kanban_board_entity_1.KanbanBoardType.AGENTE) {
                queryBuilder.innerJoin('lead_kanban_status', 'lks', 'lks.lead_id = lead.id AND lks.tipo_fluxo = :tipo_fluxo', { tipo_fluxo: tipoFluxoClean });
                if (board.nome === 'NOVOS') {
                    if (board.agente_id) {
                        queryBuilder.andWhere('lks.vendedor_id = :agente_id', {
                            agente_id: board.agente_id,
                        });
                        queryBuilder.andWhere('lks.usuario_id_colaborador IS NULL');
                    }
                }
                else {
                    if (board.colaborador_id) {
                        queryBuilder.andWhere('lks.usuario_id_colaborador = :colaborador_id', {
                            colaborador_id: board.colaborador_id,
                        });
                    }
                }
            }
            else if (board.tipo === kanban_board_entity_1.KanbanBoardType.COLABORADOR) {
                const tipoFluxoEscaped = tipoFluxoClean.replace(/'/g, "''");
                queryBuilder.innerJoin('lead_kanban_status', 'lks', `lks.lead_id = lead.id AND lks.tipo_fluxo = '${tipoFluxoEscaped}'`);
                if (board.nome === 'NOVOS') {
                    if (board.colaborador_id) {
                        queryBuilder.andWhere('lks.usuario_id_colaborador = :colaborador_id', {
                            colaborador_id: board.colaborador_id,
                        });
                        queryBuilder.andWhere('lks.kanban_status_id IS NULL');
                    }
                }
                else {
                    if (board.kanban_status_id && board.colaborador_id) {
                        queryBuilder.andWhere('lks.kanban_status_id = :kanban_status_id', {
                            kanban_status_id: board.kanban_status_id,
                        });
                        queryBuilder.andWhere('lks.usuario_id_colaborador = :colaborador_id', {
                            colaborador_id: board.colaborador_id,
                        });
                    }
                }
            }
            if (board.tipo === kanban_board_entity_1.KanbanBoardType.ADMIN) {
                queryBuilder.andWhere(':tipoFluxo = ANY(lead.tipo_lead)', { tipoFluxo: tipoFluxoClean });
            }
            if (filterDto.nome_razao_social) {
                queryBuilder.andWhere(`(${(0, pg_unaccent_search_1.pgWhereUnaccentContains)(`COALESCE(lead.nome_razao_social, '')`, 'nome')} OR ${(0, pg_unaccent_search_1.pgWhereUnaccentContains)(`COALESCE(lead.nome_fantasia_apelido, '')`, 'nome')})`, { nome: `%${filterDto.nome_razao_social.trim()}%` });
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
                if (board.tipo === kanban_board_entity_1.KanbanBoardType.ADMIN && board.nome === 'NOVOS') {
                    queryBuilder.andWhere('lks.lead_id IS NOT NULL AND lks.vendedor_id = :vendedorId', { vendedorId });
                }
                else {
                    queryBuilder.andWhere('lks.vendedor_id = :vendedorId', { vendedorId });
                }
            }
            if (filterDto.usuario_id_colaborador) {
                if (currentUser.perfil === user_entity_1.UserProfile.AGENTE) {
                    const colaborador = await this.usersRepository.findOne({
                        where: { id: filterDto.usuario_id_colaborador },
                    });
                    const currentUserId = this.normalizeId(currentUser.id);
                    const colaboradorPaiId = colaborador?.usuario_id_pai ? this.normalizeId(colaborador.usuario_id_pai) : null;
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
                if (board.tipo === kanban_board_entity_1.KanbanBoardType.ADMIN && board.nome === 'NOVOS') {
                    queryBuilder.andWhere('lks.lead_id IS NOT NULL AND lks.usuario_id_colaborador = :colaboradorId', {
                        colaboradorId
                    });
                }
                else {
                    queryBuilder.andWhere('lks.usuario_id_colaborador = :colaboradorId', {
                        colaboradorId
                    });
                }
            }
            if (filterDto.origem_lead) {
                queryBuilder.andWhere('lead.origem_lead = :origemLead', { origemLead: filterDto.origem_lead });
            }
            if (filterDto.produtos && filterDto.produtos.length > 0) {
                queryBuilder.andWhere(`EXISTS (SELECT 1 FROM leads_produto WHERE leads_produto.leads_id = lead.id AND leads_produto.produto_id IN (:...produtoIds))`, {
                    produtoIds: filterDto.produtos,
                });
            }
            queryBuilder.orderBy('lead.created_at', 'DESC');
            const leads = await queryBuilder.getMany();
            const excelData = leads.map(lead => ({
                'Nome/Razão Social': lead.nome_razao_social || '',
                'Nome Fantasia': lead.nome_fantasia_apelido || '',
                'Telefone': lead.telefone || '',
                'Email': lead.email || '',
            }));
            const worksheet = XLSX.utils.json_to_sheet(excelData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
            const excelBuffer = XLSX.write(workbook, {
                type: 'buffer',
                bookType: 'xlsx'
            });
            return excelBuffer;
        }
        catch (error) {
            console.error('[exportLeadsByBoard] Erro ao exportar leads:', error);
            throw new common_1.BadRequestException(`Erro ao exportar leads: ${error.message || 'Erro desconhecido'}`);
        }
    }
    async updateOrder(boardIds, tipo) {
        const boards = await this.kanbanBoardRepository.find({
            where: { id: (0, typeorm_2.In)(boardIds), tipo, active: true },
        });
        for (let i = 0; i < boardIds.length; i++) {
            const board = boards.find((b) => b.id === boardIds[i]);
            if (board) {
                board.ordem = i;
            }
        }
        return await this.kanbanBoardRepository.save(boards);
    }
    async bulkAddProduto(boardId, bulkAddProdutoDto, filterDto, currentUser) {
        const allLeadsResult = await this.getLeadsByBoard(boardId, { ...filterDto, page: 1, limit: 10000 }, currentUser);
        const leads = allLeadsResult.data;
        const leadIds = leads.map(lead => lead.id);
        if (leadIds.length === 0) {
            return { affected: 0, total: 0 };
        }
        const produtosExistentes = await this.leadsProdutoRepository.find({
            where: {
                leads_id: (0, typeorm_2.In)(leadIds),
                produto_id: bulkAddProdutoDto.produto_id,
            },
        });
        const leadsComProduto = new Set(produtosExistentes.map(p => p.leads_id));
        const leadsParaAdicionar = leadIds.filter(leadId => !leadsComProduto.has(leadId));
        if (leadsParaAdicionar.length === 0) {
            return { affected: 0, total: leads.length };
        }
        const produto = await this.produtoRepository.findOne({
            where: { produto_id: bulkAddProdutoDto.produto_id },
        });
        if (!produto) {
            throw new common_1.BadRequestException(`Produto com ID ${bulkAddProdutoDto.produto_id} não encontrado`);
        }
        const novosRelacionamentos = leadsParaAdicionar.map(leadId => this.leadsProdutoRepository.create({
            leads_id: leadId,
            produto_id: bulkAddProdutoDto.produto_id,
        }));
        await this.leadsProdutoRepository.save(novosRelacionamentos);
        return {
            affected: novosRelacionamentos.length,
            total: leads.length,
        };
    }
    async bulkRemoveProduto(boardId, bulkRemoveProdutoDto, filterDto, currentUser) {
        const allLeadsResult = await this.getLeadsByBoard(boardId, { ...filterDto, page: 1, limit: 10000 }, currentUser);
        const leads = allLeadsResult.data;
        const leadIds = leads.map(lead => lead.id);
        if (leadIds.length === 0) {
            return { affected: 0, total: 0 };
        }
        const result = await this.leadsProdutoRepository.delete({
            leads_id: (0, typeorm_2.In)(leadIds),
            produto_id: bulkRemoveProdutoDto.produto_id,
        });
        return {
            affected: result.affected || 0,
            total: leads.length,
        };
    }
};
exports.KanbanBoardsService = KanbanBoardsService;
exports.KanbanBoardsService = KanbanBoardsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(kanban_board_entity_1.KanbanBoard)),
    __param(1, (0, typeorm_1.InjectRepository)(lead_entity_1.Lead)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(kanban_modelo_entity_1.KanbanModelo)),
    __param(4, (0, typeorm_1.InjectRepository)(kanban_modelo_status_entity_1.KanbanModeloStatus)),
    __param(5, (0, typeorm_1.InjectRepository)(kanban_status_entity_1.KanbanStatus)),
    __param(6, (0, typeorm_1.InjectRepository)(occurrence_entity_1.Occurrence)),
    __param(7, (0, typeorm_1.InjectRepository)(leads_produto_entity_1.LeadsProduto)),
    __param(8, (0, typeorm_1.InjectRepository)(produto_entity_1.Produto)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], KanbanBoardsService);
//# sourceMappingURL=kanban-boards.service.js.map