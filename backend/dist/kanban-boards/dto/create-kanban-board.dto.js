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
exports.CreateKanbanBoardDto = void 0;
const class_validator_1 = require("class-validator");
const kanban_board_entity_1 = require("../entities/kanban-board.entity");
class CreateKanbanBoardDto {
}
exports.CreateKanbanBoardDto = CreateKanbanBoardDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nome é obrigatório' }),
    (0, class_validator_1.MaxLength)(20, { message: 'Nome não pode ter mais de 20 caracteres' }),
    __metadata("design:type", String)
], CreateKanbanBoardDto.prototype, "nome", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Cor é obrigatória' }),
    (0, class_validator_1.IsHexColor)({ message: 'Cor deve estar no formato hexadecimal (#RRGGBB)' }),
    __metadata("design:type", String)
], CreateKanbanBoardDto.prototype, "cor_hex", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'usuario_id_dono deve ser um número inteiro' }),
    __metadata("design:type", Number)
], CreateKanbanBoardDto.prototype, "usuario_id_dono", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'agente_id deve ser um número inteiro' }),
    __metadata("design:type", Number)
], CreateKanbanBoardDto.prototype, "agente_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'colaborador_id deve ser um número inteiro' }),
    __metadata("design:type", Number)
], CreateKanbanBoardDto.prototype, "colaborador_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'kanban_modelo_id deve ser um número inteiro' }),
    __metadata("design:type", Number)
], CreateKanbanBoardDto.prototype, "kanban_modelo_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'kanban_status_id deve ser um número inteiro' }),
    __metadata("design:type", Number)
], CreateKanbanBoardDto.prototype, "kanban_status_id", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(kanban_board_entity_1.KanbanBoardType, { message: 'Tipo deve ser ADMIN, AGENTE ou COLABORADOR' }),
    __metadata("design:type", String)
], CreateKanbanBoardDto.prototype, "tipo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'ordem deve ser um número inteiro' }),
    __metadata("design:type", Number)
], CreateKanbanBoardDto.prototype, "ordem", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateKanbanBoardDto.prototype, "tipo_fluxo", void 0);
//# sourceMappingURL=create-kanban-board.dto.js.map