"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const leads_service_1 = require("./leads.service");
const leads_controller_1 = require("./leads.controller");
const lead_entity_1 = require("./entities/lead.entity");
const user_entity_1 = require("../users/entities/user.entity");
const produto_entity_1 = require("../produtos/entities/produto.entity");
const ocorrencia_entity_1 = require("../ocorrencias/entities/ocorrencia.entity");
const lead_ocorrencia_entity_1 = require("../lead-ocorrencias/entities/lead-ocorrencia.entity");
const leads_produto_entity_1 = require("../leads-produtos/entities/leads-produto.entity");
const leads_import_service_1 = require("./leads-import.service");
let LeadsModule = class LeadsModule {
};
exports.LeadsModule = LeadsModule;
exports.LeadsModule = LeadsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                lead_entity_1.Lead,
                user_entity_1.User,
                produto_entity_1.Produto,
                ocorrencia_entity_1.Ocorrencia,
                lead_ocorrencia_entity_1.LeadOcorrencia,
                leads_produto_entity_1.LeadsProduto,
            ]),
        ],
        controllers: [leads_controller_1.LeadsController],
        providers: [leads_service_1.LeadsService, leads_import_service_1.LeadsImportService],
        exports: [leads_service_1.LeadsService],
    })
], LeadsModule);
//# sourceMappingURL=leads.module.js.map