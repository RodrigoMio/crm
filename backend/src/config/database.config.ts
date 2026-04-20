import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Lead } from '../leads/entities/lead.entity';
import { Produto } from '../produtos/entities/produto.entity';
import { ProdutoTipo } from '../produtos/entities/produto-tipo.entity';
import { Ocorrencia } from '../ocorrencias/entities/ocorrencia.entity';
import { LeadOcorrencia } from '../lead-ocorrencias/entities/lead-ocorrencia.entity';
import { LeadsProduto } from '../leads-produtos/entities/leads-produto.entity';
import { KanbanBoard } from '../kanban-boards/entities/kanban-board.entity';
import { KanbanModelo } from '../kanban-modelos/entities/kanban-modelo.entity';
import { KanbanModeloStatus } from '../kanban-modelos/entities/kanban-modelo-status.entity';
import { KanbanStatus } from '../kanban-modelos/entities/kanban-status.entity';
import { Occurrence } from '../occurrences/entities/occurrence.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { LandingPage } from '../landing-pages/entities/landing-page.entity';
import { LandingPageProduto } from '../landing-pages/entities/landing-page-produto.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService?: ConfigService) {}

  private getEnv(key: string, defaultValue: string): string {
    if (this.configService) {
      return this.configService.get<string>(key, defaultValue);
    }
    return process.env[key] || defaultValue;
  }

  private getEnvNumber(key: string, defaultValue: number): number {
    if (this.configService) {
      return this.configService.get<number>(key, defaultValue);
    }
    return process.env[key] ? parseInt(process.env[key]!, 10) : defaultValue;
  }

  /**
   * Railway / Neon etc.: URL completa.
   * Remove aspas, espaços e caracteres invisíveis (BOM) que quebram o DNS (EAI_FAIL).
   */
  private getDatabaseUrl(): string {
    let raw = this.getEnv('DATABASE_URL', '').trim();
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
      raw = raw.slice(1, -1).trim();
    }
    raw = raw.replace(/[\u200B-\u200D\uFEFF]/g, '');
    raw = raw.replace(/\s/g, '');
    return raw;
  }

  /**
   * SSL: explícito via DB_SSL=true, ou inferido da URL (proxy público rlwy.net, sslmode=require).
   * Conexão interna postgres.railway.internal normalmente não precisa de SSL.
   */
  private resolveSsl(databaseUrl?: string): false | { rejectUnauthorized: boolean } {
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
    } catch {
      /* URL inválida: ignora inferência */
    }
    return false;
  }

  /**
   * Opções do pool `pg`: timeout de conexão + timezone da sessão.
   * Sem timeout explícito, falhas de rede/DB podem segurar o bootstrap e o Railway
   * retorna 502 (dial timeout na PORT) antes de `app.listen()`.
   */
  private buildPgExtra(): Record<string, unknown> {
    let connectionTimeoutMillis = this.getEnvNumber('PG_CONNECTION_TIMEOUT_MS', 10_000);
    if (!Number.isFinite(connectionTimeoutMillis) || connectionTimeoutMillis < 1000) {
      connectionTimeoutMillis = 10_000;
    }
    const dbTimezone = this.getEnv('DB_TIMEZONE', '').trim();
    const extra: Record<string, unknown> = { connectionTimeoutMillis };
    if (dbTimezone.length > 0) {
      extra.options = `-c TimeZone=${dbTimezone}`;
    }
    return extra;
  }

  private typeOrmRetryOptions(): { retryAttempts: number; retryDelay: number } {
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

  createTypeOrmOptions(): DataSourceOptions {
    const extra = this.buildPgExtra();
    const retry = this.typeOrmRetryOptions();

    const entities = [
      User,
      Lead,
      Produto,
      ProdutoTipo,
      Ocorrencia,
      LeadOcorrencia,
      LeadsProduto,
      KanbanBoard,
      KanbanModelo,
      KanbanModeloStatus,
      KanbanStatus,
      Occurrence,
      Appointment,
      LandingPage,
      LandingPageProduto,
    ];

    const logging = this.getEnv('NODE_ENV', 'development') === 'development';

    const databaseUrl = this.getDatabaseUrl();
    if (databaseUrl) {
      if (logging) {
        try {
          const host = new URL(databaseUrl).hostname;
          console.log(`[DatabaseConfig] Postgres (DATABASE_URL) host: ${host}`);
        } catch {
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

  getDatabaseConfig(): DataSourceOptions {
    return this.createTypeOrmOptions();
  }
}
