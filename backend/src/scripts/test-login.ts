/**
 * Script para testar o login do usuário admin
 * Execute: npx ts-node -r tsconfig-paths/register src/scripts/test-login.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { DatabaseConfig } from '../config/database.config';
import { User } from '../users/entities/user.entity';

// Carrega o arquivo .env explicitamente
dotenv.config({ path: resolve(__dirname, '../../.env') });

async function testLogin() {
  const dbConfig = new DatabaseConfig();
  const dataSource = new DataSource(dbConfig.getDatabaseConfig());

  try {
    await dataSource.initialize();
    console.log('✅ Conectado ao banco de dados');

    const userRepository = dataSource.getRepository(User);

    // Busca o usuário admin
    const admin = await userRepository.findOne({
      where: { email: 'admin@crm.com' },
    });

    if (!admin) {
      console.error('❌ Usuário admin não encontrado!');
      process.exit(1);
    }

    console.log('\n📋 Informações do usuário:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Nome: ${admin.nome}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Perfil: ${admin.perfil}`);
    console.log(`   Ativo: ${admin.ativo}`);
    console.log(`   Hash da senha: ${admin.senha.substring(0, 20)}...`);

    // Testa a senha
    const senhaTeste = 'admin123';
    console.log(`\n🔐 Testando senha: "${senhaTeste}"`);
    
    const isPasswordValid = await bcrypt.compare(senhaTeste, admin.senha);
    
    if (isPasswordValid) {
      console.log('✅ Senha válida! O login deve funcionar.');
    } else {
      console.log('❌ Senha inválida! O hash não corresponde à senha "admin123".');
      console.log('\n💡 Execute: npm run create-admin para atualizar o hash da senha.');
    }

    await dataSource.destroy();
    console.log('\n✅ Teste concluído!');
  } catch (error: any) {
    console.error('❌ Erro ao testar login:');
    console.error(`   Mensagem: ${error.message}`);
    if (error.code) {
      console.error(`   Código: ${error.code}`);
    }
    await dataSource.destroy();
    process.exit(1);
  }
}

testLogin();









