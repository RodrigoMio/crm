'use strict';
/**
 * Launcher de produção na Railway (evita depender de sh + CRLF no Windows).
 * cwd = raiz do monorepo para FRONTEND_DIST_PATH e .env relativos.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const mainJs = path.join(root, 'backend', 'dist', 'main.js');

console.log('[railway-start]', new Date().toISOString());
console.log('[railway-start] cwd(before)=', process.cwd());
console.log('[railway-start] root=', root);
console.log('[railway-start] PORT=', process.env.PORT);
console.log('[railway-start] main=', mainJs);

if (!fs.existsSync(mainJs)) {
  console.error('[railway-start] ERRO: backend/dist/main.js não existe.');
  try {
    const b = path.join(root, 'backend');
    console.error('[railway-start] backend existe=', fs.existsSync(b), fs.existsSync(b) ? fs.readdirSync(b).join(', ') : '');
  } catch (e) {
    console.error(e);
  }
  process.exit(1);
}

process.chdir(root);
console.log('[railway-start] cwd(after chdir)=', process.cwd());

require(mainJs);
