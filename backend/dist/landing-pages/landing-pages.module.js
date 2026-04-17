"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LandingPagesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const landing_page_entity_1 = require("./entities/landing-page.entity");
const landing_page_produto_entity_1 = require("./entities/landing-page-produto.entity");
const landing_pages_service_1 = require("./landing-pages.service");
const landing_pages_controller_1 = require("./landing-pages.controller");
const landing_pages_public_controller_1 = require("./landing-pages-public.controller");
const user_entity_1 = require("../users/entities/user.entity");
const lead_entity_1 = require("../leads/entities/lead.entity");
const produto_entity_1 = require("../produtos/entities/produto.entity");
const leads_produto_entity_1 = require("../leads-produtos/entities/leads-produto.entity");
let LandingPagesModule = class LandingPagesModule {
};
exports.LandingPagesModule = LandingPagesModule;
exports.LandingPagesModule = LandingPagesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([landing_page_entity_1.LandingPage, landing_page_produto_entity_1.LandingPageProduto, produto_entity_1.Produto, leads_produto_entity_1.LeadsProduto, user_entity_1.User, lead_entity_1.Lead])],
        controllers: [landing_pages_controller_1.LandingPagesController, landing_pages_public_controller_1.LandingPagesPublicController],
        providers: [landing_pages_service_1.LandingPagesService],
        exports: [landing_pages_service_1.LandingPagesService],
    })
], LandingPagesModule);
//# sourceMappingURL=landing-pages.module.js.map