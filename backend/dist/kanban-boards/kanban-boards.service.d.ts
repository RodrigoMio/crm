import { Repository, DataSource } from 'typeorm';
import { KanbanBoard, KanbanBoardType } from './entities/kanban-board.entity';
import { CreateKanbanBoardDto } from './dto/create-kanban-board.dto';
import { UpdateKanbanBoardDto } from './dto/update-kanban-board.dto';
import { FilterKanbanBoardsDto } from './dto/filter-kanban-boards.dto';
import { FilterLeadsDto } from '../leads/dto/filter-leads.dto';
import { CreateLeadDto } from '../leads/dto/create-lead.dto';
import { BulkAddProdutoDto, BulkRemoveProdutoDto } from './dto/bulk-produto.dto';
import { Lead } from '../leads/entities/lead.entity';
import { User } from '../users/entities/user.entity';
import { KanbanModelo } from '../kanban-modelos/entities/kanban-modelo.entity';
import { KanbanModeloStatus } from '../kanban-modelos/entities/kanban-modelo-status.entity';
import { KanbanStatus } from '../kanban-modelos/entities/kanban-status.entity';
import { Occurrence } from '../occurrences/entities/occurrence.entity';
import { LeadsProduto } from '../leads-produtos/entities/leads-produto.entity';
import { Produto } from '../produtos/entities/produto.entity';
export declare enum TipoFluxo {
    COMPRADOR = "COMPRADOR",
    VENDEDOR = "VENDEDOR"
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
export declare class KanbanBoardsService {
    private kanbanBoardRepository;
    private leadsRepository;
    private usersRepository;
    private kanbanModeloRepository;
    private kanbanModeloStatusRepository;
    private kanbanStatusRepository;
    private occurrencesRepository;
    private leadsProdutoRepository;
    private produtoRepository;
    private dataSource;
    constructor(kanbanBoardRepository: Repository<KanbanBoard>, leadsRepository: Repository<Lead>, usersRepository: Repository<User>, kanbanModeloRepository: Repository<KanbanModelo>, kanbanModeloStatusRepository: Repository<KanbanModeloStatus>, kanbanStatusRepository: Repository<KanbanStatus>, occurrencesRepository: Repository<Occurrence>, leadsProdutoRepository: Repository<LeadsProduto>, produtoRepository: Repository<Produto>, dataSource: DataSource);
    private normalizeId;
    ensureNovosBoard(tipo: KanbanBoardType, currentUser: User, agenteId?: number, colaboradorId?: number, tipoFluxo?: 'COMPRADOR' | 'VENDEDOR'): Promise<KanbanBoard>;
    findAll(filterDto: FilterKanbanBoardsDto, currentUser: User): Promise<BoardWithLeadsCount[]>;
    findOne(id: number): Promise<KanbanBoard>;
    create(createKanbanBoardDto: CreateKanbanBoardDto, currentUser: User): Promise<KanbanBoard>;
    private createAutomaticBoardsForColaborador;
    update(id: number, updateKanbanBoardDto: UpdateKanbanBoardDto, currentUser: User): Promise<KanbanBoard>;
    remove(id: number, currentUser: User): Promise<void>;
    private getBoardType;
    private getTipoFluxo;
    private findLeadKanbanStatus;
    private createUserOccurrence;
    createLeadInBoard(boardId: number, createLeadDto: CreateLeadDto, currentUser: User): Promise<Lead>;
    moveLead(leadId: number, fromBoardId: number, toBoardId: number, currentUser: User): Promise<Lead>;
    private createSystemOccurrence;
    getLeadsByBoard(boardId: number, filterDto: FilterLeadsDto, currentUser: User): Promise<{
        data: Lead[];
        total: number;
        page: number;
        limit: number;
        sql?: string;
        sqlRaw?: string;
        params?: Record<string, any>;
    }>;
    private getLeadsCountByBoard;
    exportLeadsByBoard(boardId: number, filterDto: FilterLeadsDto, currentUser: User): Promise<Buffer>;
    updateOrder(boardIds: number[], tipo: KanbanBoardType): Promise<KanbanBoard[]>;
    bulkAddProduto(boardId: number, bulkAddProdutoDto: BulkAddProdutoDto, filterDto: FilterLeadsDto, currentUser: User): Promise<{
        affected: number;
        total: number;
    }>;
    bulkRemoveProduto(boardId: number, bulkRemoveProdutoDto: BulkRemoveProdutoDto, filterDto: FilterLeadsDto, currentUser: User): Promise<{
        affected: number;
        total: number;
    }>;
}
