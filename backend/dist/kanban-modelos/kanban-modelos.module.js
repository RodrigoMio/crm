"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KanbanModelosModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const kanban_modelos_service_1 = require("./kanban-modelos.service");
const kanban_modelos_controller_1 = require("./kanban-modelos.controller");
const kanban_modelo_entity_1 = require("./entities/kanban-modelo.entity");
const kanban_status_entity_1 = require("./entities/kanban-status.entity");
const kanban_modelo_status_entity_1 = require("./entities/kanban-modelo-status.entity");
let KanbanModelosModule = class KanbanModelosModule {
};
exports.KanbanModelosModule = KanbanModelosModule;
exports.KanbanModelosModule = KanbanModelosModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([kanban_modelo_entity_1.KanbanModelo, kanban_status_entity_1.KanbanStatus, kanban_modelo_status_entity_1.KanbanModeloStatus]),
        ],
        controllers: [kanban_modelos_controller_1.KanbanModelosController],
        providers: [kanban_modelos_service_1.KanbanModelosService],
        exports: [kanban_modelos_service_1.KanbanModelosService],
    })
], KanbanModelosModule);
//# sourceMappingURL=kanban-modelos.module.js.map