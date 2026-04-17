import { Response } from 'express';
import { KanbanBoardsService } from './kanban-boards.service';
import { CreateKanbanBoardDto } from './dto/create-kanban-board.dto';
import { UpdateKanbanBoardDto } from './dto/update-kanban-board.dto';
import { FilterKanbanBoardsDto } from './dto/filter-kanban-boards.dto';
import { MoveLeadDto } from './dto/move-lead.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { KanbanBoardType } from './entities/kanban-board.entity';
import { CreateLeadDto } from '../leads/dto/create-lead.dto';
import { BulkAddProdutoDto, BulkRemoveProdutoDto } from './dto/bulk-produto.dto';
export declare class KanbanBoardsController {
    private readonly kanbanBoardsService;
    constructor(kanbanBoardsService: KanbanBoardsService);
    findAllAdmin(filterDto: FilterKanbanBoardsDto, req: any): Promise<import("./kanban-boards.service").BoardWithLeadsCount[]>;
    findAllAgente(req: any, agenteId?: string, tipoFluxo?: 'COMPRADOR' | 'VENDEDOR'): Promise<import("./kanban-boards.service").BoardWithLeadsCount[]>;
    findAllColaborador(req: any, agenteId?: string, colaboradorId?: string, tipoFluxo?: 'COMPRADOR' | 'VENDEDOR'): Promise<import("./kanban-boards.service").BoardWithLeadsCount[]>;
    findOne(id: number): Promise<import("./entities/kanban-board.entity").KanbanBoard>;
    getLeadsByBoard(id: number, req: any, query: any): Promise<{
        data: import("../leads/entities/lead.entity").Lead[];
        total: number;
        page: number;
        limit: number;
        sql?: string;
        sqlRaw?: string;
        params?: Record<string, any>;
    }>;
    exportLeadsByBoard(id: number, req: any, query: any, res: Response): Promise<void>;
    create(createKanbanBoardDto: CreateKanbanBoardDto, req: any): Promise<import("./entities/kanban-board.entity").KanbanBoard>;
    createLeadInBoard(boardId: number, createLeadDto: CreateLeadDto, req: any): Promise<import("../leads/entities/lead.entity").Lead>;
    moveLead(leadId: number, moveLeadDto: MoveLeadDto, req: any): Promise<import("../leads/entities/lead.entity").Lead>;
    updateOrder(tipo: KanbanBoardType, updateOrderDto: UpdateOrderDto): Promise<import("./entities/kanban-board.entity").KanbanBoard[]>;
    update(id: number, updateKanbanBoardDto: UpdateKanbanBoardDto, req: any): Promise<import("./entities/kanban-board.entity").KanbanBoard>;
    remove(id: number, req: any): Promise<void>;
    bulkAddProduto(boardId: number, bulkAddProdutoDto: BulkAddProdutoDto, req: any, query: any): Promise<{
        affected: number;
        total: number;
    }>;
    bulkRemoveProduto(boardId: number, bulkRemoveProdutoDto: BulkRemoveProdutoDto, req: any, query: any): Promise<{
        affected: number;
        total: number;
    }>;
}
