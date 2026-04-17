"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const bcrypt = require("bcrypt");
const user_entity_1 = require("../users/entities/user.entity");
const lead_entity_1 = require("../leads/entities/lead.entity");
const database_config_1 = require("../config/database.config");
async function seed() {
    const dbConfig = new database_config_1.DatabaseConfig();
    const dataSource = new typeorm_1.DataSource(dbConfig.getDatabaseConfig());
    try {
        await dataSource.initialize();
        console.log('✅ Conectado ao banco de dados');
        const userRepository = dataSource.getRepository(user_entity_1.User);
        const leadRepository = dataSource.getRepository(lead_entity_1.Lead);
        const adminPassword = await bcrypt.hash('admin123', 10);
        const agente1Password = await bcrypt.hash('agente123', 10);
        const agente2Password = await bcrypt.hash('agente123', 10);
        const admin = await userRepository.save({
            nome: 'Administrador',
            email: 'admin@crm.com',
            senha: adminPassword,
            perfil: user_entity_1.UserProfile.ADMIN,
            ativo: true,
        });
        const agente1 = await userRepository.save({
            nome: 'João Silva',
            email: 'joao@crm.com',
            senha: agente1Password,
            perfil: user_entity_1.UserProfile.AGENTE,
            ativo: true,
        });
        const agente2 = await userRepository.save({
            nome: 'Maria Santos',
            email: 'maria@crm.com',
            senha: agente2Password,
            perfil: user_entity_1.UserProfile.AGENTE,
            ativo: true,
        });
        console.log('✅ Usuários criados');
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
                origem_lead: lead_entity_1.OrigemLead.CAMPANHA_MKT,
                vendedor_id: agente1.id,
            },
            {
                data_entrada: new Date('2024-01-20'),
                nome_razao_social: 'Pecuária do Sul',
                telefone: '(51) 99876-5432',
                uf: 'RS',
                municipio: 'Porto Alegre',
                anotacoes: 'Aguardando retorno',
                origem_lead: lead_entity_1.OrigemLead.NETWORKING,
                vendedor_id: agente1.id,
            },
            {
                data_entrada: new Date('2024-02-01'),
                nome_razao_social: 'Fazenda Verde',
                nome_fantasia_apelido: 'Fazenda Verde',
                email: 'contato@fazendaverde.com',
                uf: 'MG',
                municipio: 'Uberlândia',
                origem_lead: lead_entity_1.OrigemLead.WHATSAPP,
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
    }
    catch (error) {
        console.error('❌ Erro ao executar seed:', error);
        await dataSource.destroy();
        process.exit(1);
    }
}
seed();
//# sourceMappingURL=seed.js.map