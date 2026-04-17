"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
const path_1 = require("path");
const typeorm_1 = require("typeorm");
dotenv.config({ path: (0, path_1.resolve)(__dirname, '../../.env') });
async function createDatabase() {
    const adminDataSource = new typeorm_1.DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: 'postgres',
    });
    try {
        await adminDataSource.initialize();
        console.log('✅ Conectado ao PostgreSQL');
        const databaseName = process.env.DB_DATABASE || 'crm_lead';
        const result = await adminDataSource.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [databaseName]);
        if (result.length > 0) {
            console.log(`ℹ️  O banco de dados "${databaseName}" já existe.`);
        }
        else {
            await adminDataSource.query(`CREATE DATABASE "${databaseName}";`);
            console.log(`✅ Banco de dados "${databaseName}" criado com sucesso!`);
        }
        await adminDataSource.destroy();
        console.log('\n✅ Processo concluído!');
    }
    catch (error) {
        console.error('❌ Erro ao criar banco de dados:');
        console.error(`   Mensagem: ${error.message}`);
        if (error.code) {
            console.error(`   Código: ${error.code}`);
        }
        await adminDataSource.destroy();
        process.exit(1);
    }
}
createDatabase();
//# sourceMappingURL=create-database.js.map