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
exports.Produto = void 0;
const typeorm_1 = require("typeorm");
const produto_tipo_entity_1 = require("./produto-tipo.entity");
let Produto = class Produto {
};
exports.Produto = Produto;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'produto_id' }),
    __metadata("design:type", Number)
], Produto.prototype, "produto_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Produto.prototype, "descricao", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'produto_tipo_id', nullable: false, default: 1 }),
    __metadata("design:type", Number)
], Produto.prototype, "produto_tipo_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => produto_tipo_entity_1.ProdutoTipo),
    (0, typeorm_1.JoinColumn)({ name: 'produto_tipo_id' }),
    __metadata("design:type", produto_tipo_entity_1.ProdutoTipo)
], Produto.prototype, "produto_tipo", void 0);
exports.Produto = Produto = __decorate([
    (0, typeorm_1.Entity)('produto')
], Produto);
//# sourceMappingURL=produto.entity.js.map