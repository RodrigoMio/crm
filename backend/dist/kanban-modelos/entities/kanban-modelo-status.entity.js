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
Object.defineProperty(exports, "__esModule", { value: true });
exports.KanbanModeloStatus = void 0;
const typeorm_1 = require("typeorm");
const kanban_modelo_entity_1 = require("./kanban-modelo.entity");
const kanban_status_entity_1 = require("./kanban-status.entity");
let KanbanModeloStatus = class KanbanModeloStatus {
};
exports.KanbanModeloStatus = KanbanModeloStatus;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'kanban_modelo_status_id' }),
    __metadata("design:type", Number)
], KanbanModeloStatus.prototype, "kanban_modelo_status_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'kanban_modelo_id' }),
    __metadata("design:type", Number)
], KanbanModeloStatus.prototype, "kanban_modelo_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'kanban_status_id' }),
    __metadata("design:type", Number)
], KanbanModeloStatus.prototype, "kanban_status_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => kanban_modelo_entity_1.KanbanModelo, (modelo) => modelo.modeloStatuses),
    (0, typeorm_1.JoinColumn)({ name: 'kanban_modelo_id' }),
    __metadata("design:type", kanban_modelo_entity_1.KanbanModelo)
], KanbanModeloStatus.prototype, "kanbanModelo", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => kanban_status_entity_1.KanbanStatus, (status) => status.modeloStatuses),
    (0, typeorm_1.JoinColumn)({ name: 'kanban_status_id' }),
    __metadata("design:type", kanban_status_entity_1.KanbanStatus)
], KanbanModeloStatus.prototype, "kanbanStatus", void 0);
exports.KanbanModeloStatus = KanbanModeloStatus = __decorate([
    (0, typeorm_1.Entity)('kanban_modelo_status')
], KanbanModeloStatus);
//# sourceMappingURL=kanban-modelo-status.entity.js.map