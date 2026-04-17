"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadActivitiesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const lead_activities_controller_1 = require("./lead-activities.controller");
const lead_activities_service_1 = require("./lead-activities.service");
const lead_ocorrencia_entity_1 = require("../lead-ocorrencias/entities/lead-ocorrencia.entity");
const leads_module_1 = require("../leads/leads.module");
let LeadActivitiesModule = class LeadActivitiesModule {
};
exports.LeadActivitiesModule = LeadActivitiesModule;
exports.LeadActivitiesModule = LeadActivitiesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([lead_ocorrencia_entity_1.LeadOcorrencia]), leads_module_1.LeadsModule],
        controllers: [lead_activities_controller_1.LeadActivitiesController],
        providers: [lead_activities_service_1.LeadActivitiesService],
        exports: [lead_activities_service_1.LeadActivitiesService],
    })
], LeadActivitiesModule);
//# sourceMappingURL=lead-activities.module.js.map