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
exports.LandingPageProduto = void 0;
const typeorm_1 = require("typeorm");
const landing_page_entity_1 = require("./landing-page.entity");
const produto_entity_1 = require("../../produtos/entities/produto.entity");
let LandingPageProduto = class LandingPageProduto {
};
exports.LandingPageProduto = LandingPageProduto;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'int' }),
    __metadata("design:type", Number)
], LandingPageProduto.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], LandingPageProduto.prototype, "landing_page_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], LandingPageProduto.prototype, "produto_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => landing_page_entity_1.LandingPage, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'landing_page_id' }),
    __metadata("design:type", landing_page_entity_1.LandingPage)
], LandingPageProduto.prototype, "landing_page", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => produto_entity_1.Produto, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'produto_id' }),
    __metadata("design:type", produto_entity_1.Produto)
], LandingPageProduto.prototype, "produto", void 0);
exports.LandingPageProduto = LandingPageProduto = __decorate([
    (0, typeorm_1.Entity)('landing_pages_produto')
], LandingPageProduto);
//# sourceMappingURL=landing-page-produto.entity.js.map