/**
 * Arquivo de inicialização para produção (KingHost)
 * Este arquivo é executado pela KingHost para iniciar a aplicação NestJS
 * 
 * Estrutura na KingHost:
 * - server.js e .env estão em /apps_nodejs/crm
 * - dist/main.js deve estar no mesmo diretório ou em subdiretório
 */

// Carrega variáveis de ambiente
// Usa caminho explícito para garantir que o .env seja carregado corretamente
const path = require('path');
const fs = require('fs');

// Tenta carregar .env do diretório atual (onde server.js está)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
  console.log(`✅ Arquivo .env carregado de: ${envPath}`);
} else {
  // Fallback: tenta carregar sem especificar caminho
  require('dotenv').config();
  console.log(`⚠️ Arquivo .env não encontrado em ${envPath}, usando caminho padrão`);
}

// DEBUG: Verificar se variável está carregada (pode remover depois)
console.log(`🔍 DEBUG - FRONTEND_DIST_PATH: ${process.env.FRONTEND_DIST_PATH || 'NÃO DEFINIDO'}`);
console.log(`🔍 DEBUG - Diretório atual (__dirname): ${__dirname}`);
console.log(`🔍 DEBUG - Working directory (cwd): ${process.cwd()}`);

// Define NODE_ENV como production se não estiver definido
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// KingHost: só PORT_SERVER. Railway/Render/Fly: injetam PORT — nunca sobrescrever.
// Nest (main.ts) usa: PORT || PORT_SERVER || 3001
if (process.env.PORT_SERVER && !process.env.PORT) {
  process.env.PORT = process.env.PORT_SERVER;
}
const nestListenPort = String(
  parseInt(process.env.PORT || process.env.PORT_SERVER || '3001', 10) || 3001,
);
console.log(
  `[server.js] PORT=${process.env.PORT ?? '(vazio)'} PORT_SERVER=${process.env.PORT_SERVER ?? '(vazio)'} → Nest escuta em: ${nestListenPort}`,
);

// Caminho para o arquivo compilado
// Tenta diferentes localizações possíveis na estrutura da KingHost
const possiblePaths = [
  path.join(__dirname, 'dist', 'main.js'),        // dist/main.js no mesmo diretório
  path.join(__dirname, 'backend', 'dist', 'main.js'), // backend/dist/main.js
  path.join(__dirname, '..', 'backend', 'dist', 'main.js'), // ../backend/dist/main.js
];

let distPath = null;
for (const possiblePath of possiblePaths) {
  if (fs.existsSync(possiblePath)) {
    distPath = possiblePath;
    console.log(`✅ Arquivo encontrado em: ${distPath}`);
    break;
  }
}

// Se não encontrou, tenta usar dist/main.js no diretório atual
if (!distPath) {
  distPath = path.join(__dirname, 'dist', 'main.js');
  if (!fs.existsSync(distPath)) {
    console.error('❌ Erro: Arquivo dist/main.js não encontrado.');
    console.error('💡 Verificados os seguintes caminhos:');
    possiblePaths.forEach(p => console.error(`   - ${p}`));
    console.error('💡 Execute "npm run build" antes de fazer o deploy.');
    console.error('💡 Certifique-se de que a pasta dist/ está no mesmo diretório do server.js');
    process.exit(1);
  }
}

// Importa e executa o arquivo compilado do NestJS
try {
  console.log('🚀 Iniciando aplicação NestJS...');
  console.log(`📁 Arquivo: ${distPath}`);
  console.log(`🌐 Porta efetiva (proxy deve apontar aqui): ${nestListenPort}`);
  console.log(`🔧 Ambiente: ${process.env.NODE_ENV}`);
  
  require(distPath);
} catch (error) {
  console.error('❌ Erro ao iniciar servidor:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
}


