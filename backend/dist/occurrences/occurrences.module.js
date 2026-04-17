"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OccurrencesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const occurrences_controller_1 = require("./occurrences.controller");
const occurrences_service_1 = require("./occurrences.service");
const occurrence_entity_1 = require("./entities/occurrence.entity");
const leads_module_1 = require("../leads/leads.module");
let OccurrencesModule = class OccurrencesModule {
};
exports.OccurrencesModule = OccurrencesModule;
exports.OccurrencesModule = OccurrencesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([occurrence_entity_1.Occurrence]), leads_module_1.LeadsModule],
        controllers: [occurrences_controller_1.OccurrencesController],
        providers: [occurrences_service_1.OccurrencesService],
        exports: [occurrences_service_1.OccurrencesService],
    })
], OccurrencesModule);
//# sourceMappingURL=occurrences.module.js.map