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
exports.DatabaseConfig = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const user_entity_1 = require("../users/entities/user.entity");
const lead_entity_1 = require("../leads/entities/lead.entity");
const produto_entity_1 = require("../produtos/entities/produto.entity");
const produto_tipo_entity_1 = require("../produtos/entities/produto-tipo.entity");
const ocorrencia_entity_1 = require("../ocorrencias/entities/ocorrencia.entity");
const lead_ocorrencia_entity_1 = require("../lead-ocorrencias/entities/lead-ocorrencia.entity");
const leads_produto_entity_1 = require("../leads-produtos/entities/leads-produto.entity");
const kanban_board_entity_1 = require("../kanban-boards/entities/kanban-board.entity");
const kanban_modelo_entity_1 = require("../kanban-modelos/entities/kanban-modelo.entity");
const kanban_modelo_status_entity_1 = require("../kanban-modelos/entities/kanban-modelo-status.entity");
const kanban_status_entity_1 = require("../kanban-modelos/entities/kanban-status.entity");
const occurrence_entity_1 = require("../occurrences/entities/occurrence.entity");
const appointment_entity_1 = require("../appointments/entities/appointment.entity");
const landing_page_entity_1 = require("../landing-pages/entities/landing-page.entity");
const landing_page_produto_entity_1 = require("../landing-pages/entities/landing-page-produto.entity");
let DatabaseConfig = class DatabaseConfig {
    constructor(configService) {
        this.configService = configService;
    }
    getEnv(key, defaultValue) {
        if (this.configService) {
            return this.configService.get(key, defaultValue);
        }
        return process.env[key] || defaultValue;
    }
    getEnvNumber(key, defaultValue) {
        if (this.configService) {
            return this.configService.get(key, defaultValue);
        }
        return process.env[key] ? parseInt(process.env[key], 10) : defaultValue;
    }
    getDatabaseUrl() {
        let raw = this.getEnv('DATABASE_URL', '').trim();
        if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
            raw = raw.slice(1, -1).trim();
        }
        raw = raw.replace(/[\u200B-\u200D\uFEFF]/g, '');
        raw = raw.replace(/\s/g, '');
        return raw;
    }
    resolveSsl(databaseUrl) {
        if (this.getEnv('DB_SSL', '').toLowerCase() === 'true') {
            return { rejectUnauthorized: false };
        }
        if (!databaseUrl) {
            return false;
        }
        try {
            const u = new URL(databaseUrl);
            const mode = (u.searchParams.get('sslmode') || '').toLowerCase();
            if (['require', 'verify-ca', 'verify-full'].includes(mode)) {
                return { rejectUnauthorized: false };
            }
            if (u.hostname.endsWith('.rlwy.net')) {
                return { rejectUnauthorized: false };
            }
        }
        catch {
        }
        return false;
    }
    buildPgExtra() {
        let connectionTimeoutMillis = this.getEnvNumber('PG_CONNECTION_TIMEOUT_MS', 10_000);
        if (!Number.isFinite(connectionTimeoutMillis) || connectionTimeoutMillis < 1000) {
            connectionTimeoutMillis = 10_000;
        }
        const dbTimezone = this.getEnv('DB_TIMEZONE', '').trim();
        const extra = { connectionTimeoutMillis };
        if (dbTimezone.length > 0) {
            extra.options = `-c TimeZone=${dbTimezone}`;
        }
        return extra;
    }
    typeOrmRetryOptions() {
        let attempts = this.getEnvNumber('TYPEORM_RETRY_ATTEMPTS', 4);
        let delayMs = this.getEnvNumber('TYPEORM_RETRY_DELAY_MS', 1500);
        if (!Number.isFinite(attempts) || attempts < 1) {
            attempts = 4;
        }
        if (!Number.isFinite(delayMs) || delayMs < 100) {
            delayMs = 1500;
        }
        attempts = Math.min(20, Math.max(1, attempts));
        delayMs = Math.min(30_000, Math.max(100, delayMs));
        return { retryAttempts: attempts, retryDelay: delayMs };
    }
    createTypeOrmOptions() {
        const extra = this.buildPgExtra();
        const retry = this.typeOrmRetryOptions();
        const entities = [
            user_entity_1.User,
            lead_entity_1.Lead,
            produto_entity_1.Produto,
            produto_tipo_entity_1.ProdutoTipo,
            ocorrencia_entity_1.Ocorrencia,
            lead_ocorrencia_entity_1.LeadOcorrencia,
            leads_produto_entity_1.LeadsProduto,
            kanban_board_entity_1.KanbanBoard,
            kanban_modelo_entity_1.KanbanModelo,
            kanban_modelo_status_entity_1.KanbanModeloStatus,
            kanban_status_entity_1.KanbanStatus,
            occurrence_entity_1.Occurrence,
            appointment_entity_1.Appointment,
            landing_page_entity_1.LandingPage,
            landing_page_produto_entity_1.LandingPageProduto,
        ];
        const logging = this.getEnv('NODE_ENV', 'development') === 'development';
        const databaseUrl = this.getDatabaseUrl();
        if (databaseUrl) {
            if (logging) {
                try {
                    const host = new URL(databaseUrl).hostname;
                    console.log(`[DatabaseConfig] Postgres (DATABASE_URL) host: ${host}`);
                }
                catch {
                    console.warn('[DatabaseConfig] DATABASE_URL não é uma URL válida.');
                }
            }
            return {
                type: 'postgres',
                url: databaseUrl,
                extra,
                ...retry,
                entities,
                synchronize: false,
                logging,
                ssl: this.resolveSsl(databaseUrl),
            };
        }
        return {
            type: 'postgres',
            host: this.getEnv('DB_HOST', 'localhost'),
            port: this.getEnvNumber('DB_PORT', 5432),
            username: this.getEnv('DB_USERNAME', 'postgres'),
            password: this.getEnv('DB_PASSWORD', 'postgres'),
            database: this.getEnv('DB_DATABASE', 'crm_leads'),
            extra,
            ...retry,
            entities,
            synchronize: false,
            logging,
            ssl: this.getEnv('DB_SSL', 'false') === 'true' ? { rejectUnauthorized: false } : false,
        };
    }
    getDatabaseConfig() {
        return this.createTypeOrmOptions();
    }
};
exports.DatabaseConfig = DatabaseConfig;
exports.DatabaseConfig = DatabaseConfig = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DatabaseConfig);
//# sourceMappingURL=database.config.js.map