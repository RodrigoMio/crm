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

  createTypeOrmOptions(): DataSourceOptions {
    return {
      type: 'postgres',
      host: this.getEnv('DB_HOST', 'localhost'),
      port: this.getEnvNumber('DB_PORT', 5432),
      username: this.getEnv('DB_USERNAME', 'postgres'),
      password: this.getEnv('DB_PASSWORD', 'postgres'),
      database: this.getEnv('DB_DATABASE', 'crm_leads'),
      entities: [
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
      ],
      synchronize: false, // Desabilitado - alterações no banco devem ser feitas manualmente
      logging: this.getEnv('NODE_ENV', 'development') === 'development',
      ssl: this.getEnv('DB_SSL', 'false') === 'true' ? { rejectUnauthorized: false } : false,
    };
  }

  getDatabaseConfig(): DataSourceOptions {
    return this.createTypeOrmOptions();
  }
}
