/**
 * Script para testar conexão com o banco de dados
 * Execute: npx ts-node -r tsconfig-paths/register src/scripts/test-connection.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carrega o arquivo .env explicitamente
dotenv.config({ path: resolve(__dirname, '../../.env') });

import { DataSource } from 'typeorm';
import { DatabaseConfig } from '../config/database.config';

async function testConnection() {
  const dbConfig = new DatabaseConfig();
  const dataSource = new DataSource(dbConfig.getDatabaseConfig());

  try {
    await dataSource.initialize();
    console.log('✅ Conectado ao banco de dados com sucesso!');
    
    const options = dataSource.options as any;
    console.log(`📊 Banco: ${options.database || 'N/A'}`);
    console.log(`🖥️  Host: ${options.host || 'N/A'}`);
    console.log(`👤 Usuário: ${options.username || 'N/A'}`);
    
    // Verifica se o banco existe e está acessível
    const result = await dataSource.query('SELECT version();');
    console.log(`\n📋 Versão do PostgreSQL: ${result[0].version}`);
    
    await dataSource.destroy();
    console.log('\n✅ Teste de conexão concluído!');
  } catch (error: any) {
    console.error('❌ Erro ao conectar ao banco de dados:');
    console.error(`   Mensagem: ${error.message}`);
    if (error.code) {
      console.error(`   Código: ${error.code}`);
    }
    process.exit(1);
  }
}

testConnection();

