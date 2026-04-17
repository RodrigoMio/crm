"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
const path_1 = require("path");
dotenv.config({ path: (0, path_1.resolve)(__dirname, '../../.env') });
const typeorm_1 = require("typeorm");
const database_config_1 = require("../config/database.config");
async function testConnection() {
    const dbConfig = new database_config_1.DatabaseConfig();
    const dataSource = new typeorm_1.DataSource(dbConfig.getDatabaseConfig());
    try {
        await dataSource.initialize();
        console.log('✅ Conectado ao banco de dados com sucesso!');
        const options = dataSource.options;
        console.log(`📊 Banco: ${options.database || 'N/A'}`);
        console.log(`🖥️  Host: ${options.host || 'N/A'}`);
        console.log(`👤 Usuário: ${options.username || 'N/A'}`);
        const result = await dataSource.query('SELECT version();');
        console.log(`\n📋 Versão do PostgreSQL: ${result[0].version}`);
        await dataSource.destroy();
        console.log('\n✅ Teste de conexão concluído!');
    }
    catch (error) {
        console.error('❌ Erro ao conectar ao banco de dados:');
        console.error(`   Mensagem: ${error.message}`);
        if (error.code) {
            console.error(`   Código: ${error.code}`);
        }
        process.exit(1);
    }
}
testConnection();
//# sourceMappingURL=test-connection.js.map