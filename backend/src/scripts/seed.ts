/**
 * Script de seed para popular o banco com dados de exemplo
 * Execute: npx ts-node src/scripts/seed.ts
 */

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserProfile } from '../users/entities/user.entity';
import { Lead, LeadStatus, ItemInteresse, OrigemLead } from '../leads/entities/lead.entity';
import { DatabaseConfig } from '../config/database.config';

async function seed() {
  const dbConfig = new DatabaseConfig();
  const dataSource = new DataSource(dbConfig.getDatabaseConfig());

  try {
    await dataSource.initialize();
    console.log('✅ Conectado ao banco de dados');

    const userRepository = dataSource.getRepository(User);
    const leadRepository = dataSource.getRepository(Lead);

    // Criar usuários de exemplo
    const adminPassword = await bcrypt.hash('admin123', 10);
    const agente1Password = await bcrypt.hash('agente123', 10);
    const agente2Password = await bcrypt.hash('agente123', 10);

    const admin = await userRepository.save({
      nome: 'Administrador',
      email: 'admin@crm.com',
      senha: adminPassword,
      perfil: UserProfile.ADMIN,
      ativo: true,
    });

    const agente1 = await userRepository.save({
      nome: 'João Silva',
      email: 'joao@crm.com',
      senha: agente1Password,
      perfil: UserProfile.AGENTE,
      ativo: true,
    });

    const agente2 = await userRepository.save({
      nome: 'Maria Santos',
      email: 'maria@crm.com',
      senha: agente2Password,
      perfil: UserProfile.AGENTE,
      ativo: true,
    });

    console.log('✅ Usuários criados');

    // Criar leads de exemplo
    const leads = [
      {
        data_entrada: new Date('2024-01-15'),
        nome_razao_social: 'Fazenda São João',
        nome_fantasia_apelido: 'Fazenda SJ',
        telefone: '(11) 98765-4321',
        email: 'contato@fazendasa joao.com',
        uf: 'SP',
        municipio: 'Campinas',
        anotacoes: 'Cliente interessado em Nelore',
        status: [LeadStatus.TEM_INTERESSE, LeadStatus.LEAD_QUENTE],
        itens_interesse: [ItemInteresse.NELORE, ItemInteresse.NELORE_MOCHO],
        origem_lead: OrigemLead.CAMPANHA_MKT,
        vendedor_id: agente1.id,
      },
      {
        data_entrada: new Date('2024-01-20'),
        nome_razao_social: 'Pecuária do Sul',
        telefone: '(51) 99876-5432',
        uf: 'RS',
        municipio: 'Porto Alegre',
        anotacoes: 'Aguardando retorno',
        status: [LeadStatus.RETORNO_AGENDADO],
        itens_interesse: [ItemInteresse.ANGUS, ItemInteresse.BRANGUS],
        origem_lead: OrigemLead.NETWORKING,
        vendedor_id: agente1.id,
      },
      {
        data_entrada: new Date('2024-02-01'),
        nome_razao_social: 'Fazenda Verde',
        nome_fantasia_apelido: 'Fazenda Verde',
        email: 'contato@fazendaverde.com',
        uf: 'MG',
        municipio: 'Uberlândia',
        status: [LeadStatus.NAO_ATENDEU],
        itens_interesse: [ItemInteresse.GUZERA],
        origem_lead: OrigemLead.WHATSAPP,
        vendedor_id: agente2.id,
      },
    ];

    await leadRepository.save(leads);
    console.log('✅ Leads criados');

    console.log('\n📋 Credenciais de acesso:');
    console.log('Admin:');
    console.log('  Email: admin@crm.com');
    console.log('  Senha: admin123');
    console.log('\nAgente 1:');
    console.log('  Email: joao@crm.com');
    console.log('  Senha: agente123');
    console.log('\nAgente 2:');
    console.log('  Email: maria@crm.com');
    console.log('  Senha: agente123');

    await dataSource.destroy();
    console.log('\n✅ Seed concluído!');
  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

seed();




