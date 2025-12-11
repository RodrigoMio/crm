import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { Lead } from '../leads/entities/lead.entity';

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
      entities: [User, Lead],
      synchronize: process.env.NODE_ENV !== 'production', // false em produção
      logging: process.env.NODE_ENV === 'development',
      migrations: ['src/migrations/**/*.ts'],
      migrationsTableName: 'migrations',
    };
  }
}
