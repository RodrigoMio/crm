// Script wrapper para iniciar o servidor em modo desenvolvimento
// Encerra processos na porta 3001 antes de iniciar

const { exec } = require('child_process');
const { spawn } = require('child_process');
const path = require('path');

const killPortScript = path.join(__dirname, 'kill-port.ps1');

console.log('🔍 Verificando e encerrando processos na porta 3001...\n');

// Executa o script kill-port.ps1
exec(`powershell -ExecutionPolicy Bypass -File "${killPortScript}"`, (error, stdout, stderr) => {
  if (stdout) console.log(stdout);
  if (stderr && !stderr.includes('ExecutionPolicy')) console.error(stderr);
  
  // Aguarda um pouco para garantir que a porta foi liberada
  setTimeout(() => {
    console.log('\n🚀 Iniciando servidor em modo desenvolvimento...\n');
    
    // Inicia o servidor NestJS
    const nestProcess = spawn('nest', ['start', '--watch'], {
      stdio: 'inherit',
      shell: true,
      cwd: __dirname
    });
    
    // Trata encerramento do processo
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Encerrando servidor...');
      nestProcess.kill('SIGINT');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      nestProcess.kill('SIGTERM');
      process.exit(0);
    });
  }, 500);
});


