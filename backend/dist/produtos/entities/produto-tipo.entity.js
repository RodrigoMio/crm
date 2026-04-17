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
exports.ProdutoTipo = void 0;
const typeorm_1 = require("typeorm");
let ProdutoTipo = class ProdutoTipo {
};
exports.ProdutoTipo = ProdutoTipo;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'produto_tipo_id' }),
    __metadata("design:type", Number)
], ProdutoTipo.prototype, "produto_tipo_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], ProdutoTipo.prototype, "descricao", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, name: 'bg_color' }),
    __metadata("design:type", String)
], ProdutoTipo.prototype, "bg_color", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10 }),
    __metadata("design:type", String)
], ProdutoTipo.prototype, "color", void 0);
exports.ProdutoTipo = ProdutoTipo = __decorate([
    (0, typeorm_1.Entity)('produto_tipo')
], ProdutoTipo);
//# sourceMappingURL=produto-tipo.entity.js.map