/**
 * Script para criar/atualizar usuário admin
 * Execute: npm run create-admin
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carrega o arquivo .env explicitamente
dotenv.config({ path: resolve(__dirname, '../../.env') });

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserProfile } from '../users/entities/user.entity';
import { DatabaseConfig } from '../config/database.config';

async function createAdmin() {
  const dbConfig = new DatabaseConfig();
  const dataSource = new DataSource(dbConfig.getDatabaseConfig());

  try {
    await dataSource.initialize();
    console.log('✅ Conectado ao banco de dados');

    const userRepository = dataSource.getRepository(User);

    // Verifica se o usuário admin já existe
    let admin = await userRepository.findOne({
      where: { email: 'admin@crm.com' },
    });

    // Gera hash da senha
    const adminPassword = await bcrypt.hash('admin123', 10);

    if (admin) {
      // Atualiza o usuário existente com novo hash
      admin.senha = adminPassword;
      admin.ativo = true;
      admin.perfil = UserProfile.ADMIN;
      await userRepository.save(admin);
      console.log('✅ Usuário admin atualizado');
    } else {
      // Cria novo usuário admin
      admin = await userRepository.save({
        nome: 'Administrador',
        email: 'admin@crm.com',
        senha: adminPassword,
        perfil: UserProfile.ADMIN,
        ativo: true,
      });
      console.log('✅ Usuário admin criado');
    }

    console.log('\n📋 Credenciais de acesso:');
    console.log('Email: admin@crm.com');
    console.log('Senha: admin123');

    await dataSource.destroy();
    console.log('\n✅ Processo concluído!');
  } catch (error) {
    console.error('❌ Erro ao criar/atualizar admin:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

createAdmin();

