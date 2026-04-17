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
exports.CreateActivityDto = void 0;
const class_validator_1 = require("class-validator");
class CreateActivityDto {
}
exports.CreateActivityDto = CreateActivityDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'A data da atividade é obrigatória' }),
    (0, class_validator_1.IsDateString)({}, { message: 'A data deve estar em formato válido' }),
    __metadata("design:type", String)
], CreateActivityDto.prototype, "data", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'A ação é obrigatória' }),
    (0, class_validator_1.IsInt)({ message: 'O ID da ação deve ser um número inteiro' }),
    __metadata("design:type", Number)
], CreateActivityDto.prototype, "ocorrencia_id", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'O produto é obrigatório' }),
    (0, class_validator_1.IsInt)({ message: 'O ID do produto deve ser um número inteiro' }),
    __metadata("design:type", Number)
], CreateActivityDto.prototype, "produto_id", void 0);
//# sourceMappingURL=create-activity.dto.js.map