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
exports.UpdateOrderDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class UpdateOrderDto {
}
exports.UpdateOrderDto = UpdateOrderDto;
__decorate([
    (0, class_validator_1.IsArray)({ message: 'board_ids deve ser um array' }),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'board_ids deve ter pelo menos 1 elemento' }),
    (0, class_validator_1.IsInt)({ each: true, message: 'Cada board_id deve ser um número inteiro' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Array)
], UpdateOrderDto.prototype, "board_ids", void 0);
//# sourceMappingURL=update-order.dto.js.map