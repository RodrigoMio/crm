import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { Lead } from '../leads/entities/lead.entity';
import { Occurrence } from '../occurrences/entities/occurrence.entity';
import { KanbanModelo } from '../kanban-modelos/entities/kanban-modelo.entity';
import { KanbanStatus } from '../kanban-modelos/entities/kanban-status.entity';
import { KanbanModeloStatus } from '../kanban-modelos/entities/kanban-modelo-status.entity';
import { KanbanBoard } from '../kanban-boards/entities/kanban-board.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Produto } from '../produtos/entities/produto.entity';
import { Ocorrencia } from '../ocorrencias/entities/ocorrencia.entity';
import { LeadOcorrencia } from '../lead-ocorrencias/entities/lead-ocorrencia.entity';
import { LeadsProduto } from '../leads-produtos/entities/leads-produto.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  /**
   * Retorna configuração para o NestJS TypeORM
   */
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return this.getDatabaseConfig();
  }

  /**
   * Retorna configuração para scripts standalone (seed, migrations, etc)
   */
  getDatabaseConfig(): DataSourceOptions {
    return {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'crm_lead',
      entities: [User, Lead, Occurrence, KanbanModelo, KanbanStatus, KanbanModeloStatus, KanbanBoard, Appointment, Produto, Ocorrencia, LeadOcorrencia, LeadsProduto],
      synchronize: false, // Desabilitado - sequência deve ser criada manualmente
      logging: process.env.NODE_ENV === 'development',
      migrations: ['src/migrations/**/*.ts'],
      migrationsTableName: 'migrations',
      // Configurações para banco na nuvem
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      connectTimeoutMS: 10000, // 10 segundos de timeout
      extra: {
        max: 10, // máximo de conexões no pool
        connectionTimeoutMillis: 10000, // timeout de conexão
      },
    };
  }
}
