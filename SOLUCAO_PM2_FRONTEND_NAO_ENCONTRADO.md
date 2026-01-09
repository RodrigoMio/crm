# 🔧 Solução: PM2 Não Encontra Frontend (Mesmo com FRONTEND_DIST_PATH)

## 🔍 Diagnóstico

Pelos logs do PM2, o sistema está verificando `/www` mas ainda assim não encontra o frontend. Isso pode acontecer por:

1. **PM2 não está carregando o `.env` corretamente**
2. **O arquivo `index.html` não existe em `/www/`**
3. **Problema de permissões**
4. **Caminho absoluto incorreto**

---

## ✅ SOLUÇÃO 1: Verificar se index.html Existe

### Via SSH ou Gerenciador de Arquivos:

```bash
# Verificar se index.html existe
ls -la /www/index.html

# Verificar se assets existe
ls -la /www/assets/

# Verificar conteúdo de /www
ls -la /www/
```

**Se não existir:**
- Verifique se você fez upload do frontend corretamente
- O arquivo deve estar em `/www/index.html` (não em `/www/dist/index.html`)

---

## ✅ SOLUÇÃO 2: Verificar Caminho Absoluto Correto

O caminho pode ser diferente. Verifique qual é o caminho real:

```bash
# Verificar caminho absoluto real
pwd  # Ver onde você está
ls -la /www  # Verificar se existe
ls -la /home/crmcc/www  # Pode ser este caminho
ls -la ~/www  # Ou este
```

**Se o caminho for diferente** (ex: `/home/crmcc/www/`), atualize o `.env`:

```env
FRONTEND_DIST_PATH=/home/crmcc/www
```

---

## ✅ SOLUÇÃO 3: PM2 Não Está Carregando .env

O PM2 pode não estar carregando o `.env` automaticamente. Existem duas formas de resolver:

### Opção A: Especificar Caminho do .env no server.js

Edite `/apps_nodejs/crm/server.js` e modifique a linha que carrega o `.env`:

```javascript
// ANTES:
require('dotenv').config();

// DEPOIS (especificar caminho absoluto):
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
```

**Ou use caminho absoluto completo:**
```javascript
require('dotenv').config({ path: '/home/crmcc/apps_nodejs/crm/.env' });
```

### Opção B: Configurar PM2 para Carregar .env

Se você tem acesso ao PM2, pode configurar para carregar o `.env`:

```bash
# Parar a aplicação
pm2 stop crm

# Reiniciar especificando o arquivo .env
pm2 start server.js --name crm --env production --update-env

# Ou criar arquivo ecosystem.config.js
```

**Criar arquivo `ecosystem.config.js` em `/apps_nodejs/crm/`:**

```javascript
module.exports = {
  apps: [{
    name: 'crm',
    script: './server.js',
    cwd: '/home/crmcc/apps_nodejs/crm',
    env_file: '/home/crmcc/apps_nodejs/crm/.env',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

Depois:
```bash
pm2 start ecosystem.config.js
pm2 save
```

---

## ✅ SOLUÇÃO 4: Adicionar Log de Debug

Para verificar se a variável está sendo carregada, adicione um log temporário no `server.js`:

Edite `/apps_nodejs/crm/server.js` e adicione após `require('dotenv').config()`:

```javascript
// Carrega variáveis de ambiente
require('dotenv').config();

// DEBUG: Verificar se variável está carregada
console.log('🔍 DEBUG - FRONTEND_DIST_PATH:', process.env.FRONTEND_DIST_PATH);
console.log('🔍 DEBUG - Diretório atual:', __dirname);
console.log('🔍 DEBUG - Working directory:', process.cwd());
```

Reinicie a aplicação e verifique os logs. Se aparecer `undefined`, o `.env` não está sendo carregado.

---

## ✅ SOLUÇÃO 5: Usar Caminho Absoluto Completo no Código

Se nada funcionar, você pode modificar temporariamente o `main.ts` para usar o caminho fixo.

**⚠️ ATENÇÃO:** Isso requer recompilar o backend.

1. **Edite `backend/src/main.ts`:**

Localize a linha 71 e modifique:

```typescript
const possibleFrontendPaths = [
  // Caminho absoluto fixo (KingHost)
  '/www',
  '/home/crmcc/www',  // Tente este também se o anterior não funcionar
  // ... resto dos caminhos
  process.env.FRONTEND_DIST_PATH,
].filter(Boolean);
```

2. **Recompile o backend:**
```powershell
cd backend
npm run build
```

3. **Faça upload da pasta `dist/` novamente**

---

## ✅ SOLUÇÃO 6: Verificar Permissões

O Node.js pode não ter permissão para ler o diretório `/www/`:

```bash
# Verificar permissões
ls -la /www/

# Se necessário, ajustar permissões (CUIDADO!)
chmod 755 /www
chmod 644 /www/index.html
```

---

## 🔍 DIAGNÓSTICO PASSO A PASSO

### 1. Verificar se index.html Existe

```bash
# Via SSH
test -f /www/index.html && echo "✅ index.html existe" || echo "❌ index.html NÃO existe"
```

### 2. Verificar se PM2 Está Lendo .env

Adicione no `server.js` (temporariamente):
```javascript
console.log('🔍 FRONTEND_DIST_PATH:', process.env.FRONTEND_DIST_PATH);
```

Reinicie e veja os logs. Se aparecer `undefined`, o problema é o `.env`.

### 3. Verificar Caminho Absoluto

```bash
# Verificar caminho real
realpath /www
# ou
readlink -f /www
```

Use esse caminho no `.env`.

### 4. Testar Acesso ao Arquivo

```bash
# Tentar ler o arquivo como o usuário do Node.js
node -e "const fs = require('fs'); console.log(fs.existsSync('/www/index.html') ? '✅ Existe' : '❌ Não existe');"
```

---

## 🚀 SOLUÇÃO RÁPIDA (Tente Nesta Ordem)

### Passo 1: Verificar Arquivos
```bash
ls -la /www/index.html
ls -la /www/assets/
```

### Passo 2: Verificar Caminho Real
```bash
realpath /www
# Use o resultado no .env
```

### Passo 3: Atualizar server.js
Edite `/apps_nodejs/crm/server.js` e mude:
```javascript
require('dotenv').config();
```
Para:
```javascript
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
console.log('🔍 FRONTEND_DIST_PATH:', process.env.FRONTEND_DIST_PATH);
```

### Passo 4: Reiniciar PM2
```bash
pm2 restart crm
# ou via painel da KingHost
```

### Passo 5: Verificar Logs
```bash
pm2 logs crm --lines 50
```

Procure por:
- `✅ Frontend encontrado em: /www`
- `🔍 FRONTEND_DIST_PATH: /www`

---

## 📋 CHECKLIST

- [ ] `index.html` existe em `/www/index.html`
- [ ] Pasta `assets/` existe em `/www/assets/`
- [ ] `.env` tem `FRONTEND_DIST_PATH=/www` (ou caminho correto)
- [ ] `server.js` está carregando `.env` do caminho correto
- [ ] PM2 foi reiniciado após alterações
- [ ] Logs mostram a variável sendo carregada
- [ ] Permissões estão corretas

---

## 💡 DICA FINAL

Se nada funcionar, tente usar o caminho absoluto completo no `.env`:

```env
FRONTEND_DIST_PATH=/home/crmcc/www
```

E certifique-se de que o `server.js` está carregando o `.env` do lugar certo:

```javascript
require('dotenv').config({ path: '/home/crmcc/apps_nodejs/crm/.env' });
```

---

## 📞 Se Ainda Não Funcionar

1. **Verifique os logs completos do PM2:**
   ```bash
   pm2 logs crm --lines 100
   ```

2. **Teste manualmente:**
   ```bash
   cd /home/crmcc/apps_nodejs/crm
   node -e "require('dotenv').config(); console.log(process.env.FRONTEND_DIST_PATH);"
   ```

3. **Verifique se o arquivo .env está no lugar certo:**
   ```bash
   ls -la /home/crmcc/apps_nodejs/crm/.env
   cat /home/crmcc/apps_nodejs/crm/.env | grep FRONTEND
   ```



