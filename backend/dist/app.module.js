"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const leads_module_1 = require("./leads/leads.module");
const occurrences_module_1 = require("./occurrences/occurrences.module");
const kanban_modelos_module_1 = require("./kanban-modelos/kanban-modelos.module");
const kanban_boards_module_1 = require("./kanban-boards/kanban-boards.module");
const appointments_module_1 = require("./appointments/appointments.module");
const produtos_module_1 = require("./produtos/produtos.module");
const lead_activities_module_1 = require("./lead-activities/lead-activities.module");
const ocorrencias_module_1 = require("./ocorrencias/ocorrencias.module");
const landing_pages_module_1 = require("./landing-pages/landing-pages.module");
const database_config_1 = require("./config/database.config");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                useClass: database_config_1.DatabaseConfig,
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            leads_module_1.LeadsModule,
            occurrences_module_1.OccurrencesModule,
            kanban_modelos_module_1.KanbanModelosModule,
            kanban_boards_module_1.KanbanBoardsModule,
            appointments_module_1.AppointmentsModule,
            produtos_module_1.ProdutosModule,
            lead_activities_module_1.LeadActivitiesModule,
            ocorrencias_module_1.OcorrenciasModule,
            landing_pages_module_1.LandingPagesModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map