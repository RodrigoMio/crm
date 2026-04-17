"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
const path_1 = require("path");
dotenv.config({ path: (0, path_1.resolve)(__dirname, '../../.env') });
const typeorm_1 = require("typeorm");
const bcrypt = require("bcrypt");
const user_entity_1 = require("../users/entities/user.entity");
const database_config_1 = require("../config/database.config");
async function createAdmin() {
    const dbConfig = new database_config_1.DatabaseConfig();
    const dataSource = new typeorm_1.DataSource(dbConfig.getDatabaseConfig());
    try {
        await dataSource.initialize();
        console.log('✅ Conectado ao banco de dados');
        const userRepository = dataSource.getRepository(user_entity_1.User);
        let admin = await userRepository.findOne({
            where: { email: 'admin@crm.com' },
        });
        const adminPassword = await bcrypt.hash('admin123', 10);
        if (admin) {
            admin.senha = adminPassword;
            admin.ativo = true;
            admin.perfil = user_entity_1.UserProfile.ADMIN;
            await userRepository.save(admin);
            console.log('✅ Usuário admin atualizado');
        }
        else {
            admin = await userRepository.save({
                nome: 'Administrador',
                email: 'admin@crm.com',
                senha: adminPassword,
                perfil: user_entity_1.UserProfile.ADMIN,
                ativo: true,
            });
            console.log('✅ Usuário admin criado');
        }
        console.log('\n📋 Credenciais de acesso:');
        console.log('Email: admin@crm.com');
        console.log('Senha: admin123');
        await dataSource.destroy();
        console.log('\n✅ Processo concluído!');
    }
    catch (error) {
        console.error('❌ Erro ao criar/atualizar admin:', error);
        await dataSource.destroy();
        process.exit(1);
    }
}
createAdmin();
//# sourceMappingURL=create-admin.js.map