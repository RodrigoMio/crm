/**
 * Script para criar o banco de dados
 * Execute: npx ts-node -r tsconfig-paths/register src/scripts/create-database.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { DataSource } from 'typeorm';

// Carrega o arquivo .env explicitamente
dotenv.config({ path: resolve(__dirname, '../../.env') });

async function createDatabase() {
  // Conecta ao banco 'postgres' (banco padrão) para criar o novo banco
  const adminDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres', // Conecta ao banco padrão
  });

  try {
    await adminDataSource.initialize();
    console.log('✅ Conectado ao PostgreSQL');

    const databaseName = process.env.DB_DATABASE || 'crm_lead';
    
    // Verifica se o banco já existe
    const result = await adminDataSource.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [databaseName]
    );

    if (result.length > 0) {
      console.log(`ℹ️  O banco de dados "${databaseName}" já existe.`);
    } else {
      // Cria o banco de dados
      await adminDataSource.query(`CREATE DATABASE "${databaseName}";`);
      console.log(`✅ Banco de dados "${databaseName}" criado com sucesso!`);
    }

    await adminDataSource.destroy();
    console.log('\n✅ Processo concluído!');
  } catch (error: any) {
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

