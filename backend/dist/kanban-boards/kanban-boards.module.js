"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KanbanBoardsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const kanban_boards_service_1 = require("./kanban-boards.service");
const kanban_boards_controller_1 = require("./kanban-boards.controller");
const kanban_board_entity_1 = require("./entities/kanban-board.entity");
const lead_entity_1 = require("../leads/entities/lead.entity");
const user_entity_1 = require("../users/entities/user.entity");
const kanban_modelo_entity_1 = require("../kanban-modelos/entities/kanban-modelo.entity");
const kanban_modelo_status_entity_1 = require("../kanban-modelos/entities/kanban-modelo-status.entity");
const kanban_status_entity_1 = require("../kanban-modelos/entities/kanban-status.entity");
const occurrence_entity_1 = require("../occurrences/entities/occurrence.entity");
const leads_produto_entity_1 = require("../leads-produtos/entities/leads-produto.entity");
const produto_entity_1 = require("../produtos/entities/produto.entity");
let KanbanBoardsModule = class KanbanBoardsModule {
};
exports.KanbanBoardsModule = KanbanBoardsModule;
exports.KanbanBoardsModule = KanbanBoardsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                kanban_board_entity_1.KanbanBoard,
                lead_entity_1.Lead,
                user_entity_1.User,
                kanban_modelo_entity_1.KanbanModelo,
                kanban_modelo_status_entity_1.KanbanModeloStatus,
                kanban_status_entity_1.KanbanStatus,
                occurrence_entity_1.Occurrence,
                leads_produto_entity_1.LeadsProduto,
                produto_entity_1.Produto,
            ]),
        ],
        controllers: [kanban_boards_controller_1.KanbanBoardsController],
        providers: [kanban_boards_service_1.KanbanBoardsService],
        exports: [kanban_boards_service_1.KanbanBoardsService],
    })
], KanbanBoardsModule);
//# sourceMappingURL=kanban-boards.module.js.map