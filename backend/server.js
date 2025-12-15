/**
 * Arquivo de inicialização para produção (KingHost)
 * Este arquivo é executado pela KingHost para iniciar a aplicação
 * 
 * A KingHost procura por este arquivo ou usa o script "start" do package.json
 */

// Carrega variáveis de ambiente
require('dotenv').config();

const path = require('path');
const fs = require('fs');

// Caminho para o arquivo compilado
const distPath = path.join(__dirname, 'dist', 'main.js');

// Verifica se o build existe
if (!fs.existsSync(distPath)) {
  console.error('❌ Erro: Arquivo dist/main.js não encontrado.');
  console.error('💡 Execute "npm run build" antes de fazer o deploy.');
  process.exit(1);
}

// Define NODE_ENV como production se não estiver definido
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// Importa e executa o arquivo compilado
try {
  require(distPath);
} catch (error) {
  console.error('❌ Erro ao iniciar servidor:', error);
  process.exit(1);
}

