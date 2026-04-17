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
exports.KanbanBoardsController = void 0;
const common_1 = require("@nestjs/common");
const kanban_boards_service_1 = require("./kanban-boards.service");
const create_kanban_board_dto_1 = require("./dto/create-kanban-board.dto");
const update_kanban_board_dto_1 = require("./dto/update-kanban-board.dto");
const filter_kanban_boards_dto_1 = require("./dto/filter-kanban-boards.dto");
const move_lead_dto_1 = require("./dto/move-lead.dto");
const update_order_dto_1 = require("./dto/update-order.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const user_entity_1 = require("../users/entities/user.entity");
const kanban_board_entity_1 = require("./entities/kanban-board.entity");
const create_lead_dto_1 = require("../leads/dto/create-lead.dto");
const bulk_produto_dto_1 = require("./dto/bulk-produto.dto");
let KanbanBoardsController = class KanbanBoardsController {
    constructor(kanbanBoardsService) {
        this.kanbanBoardsService = kanbanBoardsService;
    }
    async findAllAdmin(filterDto, req) {
        if (req.user?.perfil !== user_entity_1.UserProfile.ADMIN) {
            throw new common_1.ForbiddenException('Apenas administradores podem acessar Kanban Admin');
        }
        return this.kanbanBoardsService.findAll({ ...filterDto, tipo: kanban_board_entity_1.KanbanBoardType.ADMIN }, req.user);
    }
    async findAllAgente(req, agenteId, tipoFluxo) {
        if (req.user?.perfil !== user_entity_1.UserProfile.ADMIN &&
            req.user?.perfil !== user_entity_1.UserProfile.AGENTE) {
            throw new common_1.ForbiddenException('Apenas Admin ou Agente podem acessar Kanban Agente');
        }
        let agenteIdNumber;
        if (req.user.perfil === user_entity_1.UserProfile.ADMIN) {
            if (!agenteId) {
                return [];
            }
            agenteIdNumber = parseInt(agenteId, 10);
        }
        else {
            agenteIdNumber = typeof req.user.id === 'string'
                ? parseInt(req.user.id, 10)
                : req.user.id;
        }
        return this.kanbanBoardsService.findAll({
            tipo: kanban_board_entity_1.KanbanBoardType.AGENTE,
            agente_id: agenteIdNumber,
            tipo_fluxo: tipoFluxo,
        }, req.user);
    }
    async findAllColaborador(req, agenteId, colaboradorId, tipoFluxo) {
        if (req.user?.perfil !== user_entity_1.UserProfile.ADMIN &&
            req.user?.perfil !== user_entity_1.UserProfile.AGENTE &&
            req.user?.perfil !== user_entity_1.UserProfile.COLABORADOR) {
            throw new common_1.ForbiddenException('Apenas Admin, Agente ou Colaborador podem acessar Kanban Colaborador');
        }
        let colaboradorIdNumber;
        if (req.user.perfil === user_entity_1.UserProfile.COLABORADOR) {
            colaboradorIdNumber = typeof req.user.id === 'string'
                ? parseInt(req.user.id, 10)
                : req.user.id;
        }
        else if (req.user.perfil === user_entity_1.UserProfile.ADMIN || req.user.perfil === user_entity_1.UserProfile.AGENTE) {
            if (!colaboradorId) {
                return [];
            }
            colaboradorIdNumber = parseInt(colaboradorId, 10);
        }
        return this.kanbanBoardsService.findAll({
            tipo: kanban_board_entity_1.KanbanBoardType.COLABORADOR,
            colaborador_id: colaboradorIdNumber,
            tipo_fluxo: tipoFluxo,
        }, req.user);
    }
    findOne(id) {
        return this.kanbanBoardsService.findOne(id);
    }
    getLeadsByBoard(id, req, query) {
        const filterDto = {
            nome_razao_social: query.nome_razao_social || query.nome,
            email: query.email,
            telefone: query.telefone,
            uf: query.uf
                ? Array.isArray(query.uf)
                    ? query.uf
                    : [query.uf]
                : undefined,
            vendedor_id: query.vendedor_id ? parseInt(query.vendedor_id, 10) : undefined,
            usuario_id_colaborador: query.usuario_id_colaborador ? parseInt(query.usuario_id_colaborador, 10) : undefined,
            origem_lead: query.origem_lead,
            produtos: query.produtos
                ? Array.isArray(query.produtos)
                    ? query.produtos.map((p) => parseInt(p, 10))
                    : [parseInt(query.produtos, 10)]
                : undefined,
            page: query.page ? parseInt(query.page, 10) : 1,
            limit: query.limit ? parseInt(query.limit, 10) : 50,
        };
        return this.kanbanBoardsService.getLeadsByBoard(id, filterDto, req.user);
    }
    async exportLeadsByBoard(id, req, query, res) {
        const filterDto = {
            nome_razao_social: query.nome_razao_social || query.nome,
            email: query.email,
            telefone: query.telefone,
            uf: query.uf
                ? Array.isArray(query.uf)
                    ? query.uf
                    : [query.uf]
                : undefined,
            vendedor_id: query.vendedor_id ? parseInt(query.vendedor_id, 10) : undefined,
            usuario_id_colaborador: query.usuario_id_colaborador ? parseInt(query.usuario_id_colaborador, 10) : undefined,
            origem_lead: query.origem_lead,
            produtos: query.produtos
                ? Array.isArray(query.produtos)
                    ? query.produtos.map((p) => parseInt(p, 10))
                    : [parseInt(query.produtos, 10)]
                : undefined,
        };
        const board = await this.kanbanBoardsService.findOne(id);
        const excelBuffer = await this.kanbanBoardsService.exportLeadsByBoard(id, filterDto, req.user);
        const fileName = `leads-${board.nome.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(excelBuffer);
    }
    create(createKanbanBoardDto, req) {
        return this.kanbanBoardsService.create(createKanbanBoardDto, req.user);
    }
    createLeadInBoard(boardId, createLeadDto, req) {
        return this.kanbanBoardsService.createLeadInBoard(boardId, createLeadDto, req.user);
    }
    moveLead(leadId, moveLeadDto, req) {
        return this.kanbanBoardsService.moveLead(leadId, moveLeadDto.from_board_id, moveLeadDto.to_board_id, req.user);
    }
    updateOrder(tipo, updateOrderDto) {
        return this.kanbanBoardsService.updateOrder(updateOrderDto.board_ids, tipo);
    }
    update(id, updateKanbanBoardDto, req) {
        return this.kanbanBoardsService.update(id, updateKanbanBoardDto, req.user);
    }
    remove(id, req) {
        return this.kanbanBoardsService.remove(id, req.user);
    }
    bulkAddProduto(boardId, bulkAddProdutoDto, req, query) {
        const filterDto = {
            nome_razao_social: query.nome_razao_social || query.nome,
            email: query.email,
            telefone: query.telefone,
            uf: query.uf
                ? Array.isArray(query.uf)
                    ? query.uf
                    : [query.uf]
                : undefined,
            vendedor_id: query.vendedor_id ? parseInt(query.vendedor_id, 10) : undefined,
            usuario_id_colaborador: query.usuario_id_colaborador ? parseInt(query.usuario_id_colaborador, 10) : undefined,
            origem_lead: query.origem_lead,
            produtos: query.produtos
                ? Array.isArray(query.produtos)
                    ? query.produtos.map((p) => parseInt(p, 10))
                    : [parseInt(query.produtos, 10)]
                : undefined,
        };
        return this.kanbanBoardsService.bulkAddProduto(boardId, bulkAddProdutoDto, filterDto, req.user);
    }
    bulkRemoveProduto(boardId, bulkRemoveProdutoDto, req, query) {
        const filterDto = {
            nome_razao_social: query.nome_razao_social || query.nome,
            email: query.email,
            telefone: query.telefone,
            uf: query.uf
                ? Array.isArray(query.uf)
                    ? query.uf
                    : [query.uf]
                : undefined,
            vendedor_id: query.vendedor_id ? parseInt(query.vendedor_id, 10) : undefined,
            usuario_id_colaborador: query.usuario_id_colaborador ? parseInt(query.usuario_id_colaborador, 10) : undefined,
            origem_lead: query.origem_lead,
            produtos: query.produtos
                ? Array.isArray(query.produtos)
                    ? query.produtos.map((p) => parseInt(p, 10))
                    : [parseInt(query.produtos, 10)]
                : undefined,
        };
        return this.kanbanBoardsService.bulkRemoveProduto(boardId, bulkRemoveProdutoDto, filterDto, req.user);
    }
};
exports.KanbanBoardsController = KanbanBoardsController;
__decorate([
    (0, common_1.Get)('admin'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filter_kanban_boards_dto_1.FilterKanbanBoardsDto, Object]),
    __metadata("design:returntype", Promise)
], KanbanBoardsController.prototype, "findAllAdmin", null);
__decorate([
    (0, common_1.Get)('agente'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('agente_id')),
    __param(2, (0, common_1.Query)('tipo_fluxo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], KanbanBoardsController.prototype, "findAllAgente", null);
__decorate([
    (0, common_1.Get)('colaborador'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('agente_id')),
    __param(2, (0, common_1.Query)('colaborador_id')),
    __param(3, (0, common_1.Query)('tipo_fluxo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], KanbanBoardsController.prototype, "findAllColaborador", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], KanbanBoardsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/leads'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], KanbanBoardsController.prototype, "getLeadsByBoard", null);
__decorate([
    (0, common_1.Get)(':id/leads/export'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Query)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], KanbanBoardsController.prototype, "exportLeadsByBoard", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_kanban_board_dto_1.CreateKanbanBoardDto, Object]),
    __metadata("design:returntype", void 0)
], KanbanBoardsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':boardId/leads'),
    __param(0, (0, common_1.Param)('boardId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_lead_dto_1.CreateLeadDto, Object]),
    __metadata("design:returntype", void 0)
], KanbanBoardsController.prototype, "createLeadInBoard", null);
__decorate([
    (0, common_1.Post)('leads/:leadId/move'),
    __param(0, (0, common_1.Param)('leadId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, move_lead_dto_1.MoveLeadDto, Object]),
    __metadata("design:returntype", void 0)
], KanbanBoardsController.prototype, "moveLead", null);
__decorate([
    (0, common_1.Put)('order/:tipo'),
    __param(0, (0, common_1.Param)('tipo')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_order_dto_1.UpdateOrderDto]),
    __metadata("design:returntype", void 0)
], KanbanBoardsController.prototype, "updateOrder", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_kanban_board_dto_1.UpdateKanbanBoardDto, Object]),
    __metadata("design:returntype", void 0)
], KanbanBoardsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], KanbanBoardsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':boardId/leads/bulk-add-produto'),
    __param(0, (0, common_1.Param)('boardId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __param(3, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, bulk_produto_dto_1.BulkAddProdutoDto, Object, Object]),
    __metadata("design:returntype", void 0)
], KanbanBoardsController.prototype, "bulkAddProduto", null);
__decorate([
    (0, common_1.Delete)(':boardId/leads/bulk-remove-produto'),
    __param(0, (0, common_1.Param)('boardId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __param(3, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, bulk_produto_dto_1.BulkRemoveProdutoDto, Object, Object]),
    __metadata("design:returntype", void 0)
], KanbanBoardsController.prototype, "bulkRemoveProduto", null);
exports.KanbanBoardsController = KanbanBoardsController = __decorate([
    (0, common_1.Controller)('kanban-boards'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [kanban_boards_service_1.KanbanBoardsService])
], KanbanBoardsController);
//# sourceMappingURL=kanban-boards.controller.js.map