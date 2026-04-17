"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
const path_1 = require("path");
const bcrypt = require("bcrypt");
const typeorm_1 = require("typeorm");
const database_config_1 = require("../config/database.config");
const user_entity_1 = require("../users/entities/user.entity");
dotenv.config({ path: (0, path_1.resolve)(__dirname, '../../.env') });
async function testLogin() {
    const dbConfig = new database_config_1.DatabaseConfig();
    const dataSource = new typeorm_1.DataSource(dbConfig.getDatabaseConfig());
    try {
        await dataSource.initialize();
        console.log('✅ Conectado ao banco de dados');
        const userRepository = dataSource.getRepository(user_entity_1.User);
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
        const senhaTeste = 'admin123';
        console.log(`\n🔐 Testando senha: "${senhaTeste}"`);
        const isPasswordValid = await bcrypt.compare(senhaTeste, admin.senha);
        if (isPasswordValid) {
            console.log('✅ Senha válida! O login deve funcionar.');
        }
        else {
            console.log('❌ Senha inválida! O hash não corresponde à senha "admin123".');
            console.log('\n💡 Execute: npm run create-admin para atualizar o hash da senha.');
        }
        await dataSource.destroy();
        console.log('\n✅ Teste concluído!');
    }
    catch (error) {
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
//# sourceMappingURL=test-login.js.map