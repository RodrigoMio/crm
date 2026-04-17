import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
export declare class DatabaseConfig implements TypeOrmOptionsFactory {
    private configService?;
    constructor(configService?: ConfigService);
    private getEnv;
    private getEnvNumber;
    createTypeOrmOptions(): DataSourceOptions;
    getDatabaseConfig(): DataSourceOptions;
}
