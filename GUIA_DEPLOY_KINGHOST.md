# 🚀 Guia de Deploy - KingHost

## 📋 1. COMANDOS PARA EXECUTAR LOCALMENTE

Execute estes comandos na raiz do projeto (`C:\Users\rjmio\projetos-cursor\CRM`):

```powershell
# Compilar Frontend
cd frontend
npm run build
cd ..

# Compilar Backend
cd backend
npm run build
cd ..
```

**Resultado esperado:**
- ✅ `frontend/dist/` criado com os arquivos compilados
- ✅ `backend/dist/` atualizado com os arquivos compilados

---

## 📦 2. ARQUIVOS PARA SUBIR NA KINGHOST

### Estrutura de Diretórios na KingHost:

```
apps_nodejs/crm/
├── dist/                          ← Backend compilado (pasta inteira)
│   ├── main.js
│   ├── app.module.js
│   ├── auth/
│   ├── leads/
│   ├── users/
│   ├── kanban-boards/
│   ├── kanban-modelos/
│   ├── occurrences/
│   └── ... (todos os arquivos .js e .d.ts)
│
├── frontend/                      ← Frontend compilado (pasta inteira)
│   └── dist/
│       ├── index.html
│       └── assets/
│           ├── index-*.css
│           └── index-*.js
│
├── server.js                      ← Arquivo de inicialização
├── package.json                   ← Dependências do backend
└── .env                           ← Variáveis de ambiente (NÃO compartilhar!)
```

### Lista Detalhada de Arquivos:

#### ✅ Backend (`apps_nodejs/crm/`)

**Pasta `dist/` (toda a pasta):**
- Todos os arquivos `.js` e `.d.ts` gerados pela compilação
- Inclui: `main.js`, `app.module.js`, e todas as pastas (auth, leads, users, etc.)

**Arquivos na raiz:**
- `server.js` (de `backend/server.js`)
- `package.json` (de `backend/package.json`)
- `.env` (criar/editar na KingHost com suas credenciais)

#### ✅ Frontend (`apps_nodejs/crm/frontend/dist/`)

**Pasta `frontend/dist/` (toda a pasta):**
- `index.html`
- `assets/index-*.css`
- `assets/index-*.js`

**⚠️ IMPORTANTE:** 
- NÃO suba a pasta `frontend/src/` (código fonte)
- NÃO suba `node_modules/`
- Apenas o conteúdo de `frontend/dist/`

---

## 🔧 3. COMANDOS PARA EXECUTAR NA KINGHOST

### Passo 1: Conectar via SSH/Terminal

Acesse o terminal da KingHost (via painel ou SSH).

### Passo 2: Navegar para o diretório

```bash
cd apps_nodejs/crm
```

### Passo 3: Instalar dependências (apenas na primeira vez ou após atualizar package.json)

```bash
npm install --production
```

**Nota:** O `--production` instala apenas dependências de produção (sem devDependencies).

### Passo 4: Verificar estrutura

```bash
# Verificar se os arquivos estão corretos
ls -la
ls -la dist/
ls -la frontend/dist/
```

**Resultado esperado:**
- ✅ `dist/main.js` existe
- ✅ `frontend/dist/index.html` existe
- ✅ `server.js` existe
- ✅ `package.json` existe

### Passo 5: Configurar .env (se ainda não configurado)

```bash
# Editar o arquivo .env
nano .env
```

**Conteúdo mínimo do .env:**
```env
# Banco de Dados
DB_HOST=seu_host_postgresql
DB_PORT=5432
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha
DB_DATABASE=nome_do_banco
DB_SSL=true

# JWT
JWT_SECRET=sua_chave_secreta_jwt_aqui

# Porta (KingHost define automaticamente, mas pode definir manualmente)
PORT_SERVER=3001

# Frontend URL (opcional - para CORS)
FRONTEND_URL=https://crmcc.kinghost.net
```

**Salvar:** `Ctrl + X`, depois `Y`, depois `Enter`

### Passo 6: Reiniciar a aplicação

Na KingHost, reinicie a aplicação Node.js através do painel de controle:
- Painel KingHost → Aplicações Node.js → Reiniciar

**OU** se tiver acesso via terminal e PM2:

```bash
# Se usar PM2
pm2 restart crm
# ou
pm2 restart all
```

---

## ✅ 4. VERIFICAÇÃO PÓS-DEPLOY

### Verificar se está funcionando:

1. **Frontend:**
   - Acesse: `https://crmcc.kinghost.net/`
   - Deve carregar a tela de login

2. **API:**
   - Acesse: `https://crmcc.kinghost.net/api/`
   - Deve retornar erro 404 (normal, pois não há rota na raiz da API)

3. **Teste de Login:**
   - Acesse o frontend e tente fazer login
   - Se funcionar, o deploy está correto!

### Verificar Logs (se disponível):

```bash
# Se usar PM2
pm2 logs crm

# Ou verificar logs da KingHost no painel
```

**Logs esperados:**
```
✅ Frontend encontrado em: /caminho/para/frontend/dist
🚀 Backend rodando na porta 3001
📡 API disponível em http://localhost:3001/api
🌐 Frontend disponível em http://localhost:3001/
```

---

## 🔍 5. TROUBLESHOOTING

### Problema: Frontend não carrega (404)

**Solução 1:** Verificar se a pasta `frontend/dist/` existe
```bash
ls -la frontend/dist/
```

**Solução 2:** Definir caminho absoluto no `.env`
```env
FRONTEND_DIST_PATH=/home/usuario/apps_nodejs/crm/frontend/dist
```

### Problema: Erro de dependências

**Solução:** Reinstalar dependências
```bash
rm -rf node_modules
npm install --production
```

### Problema: Erro de conexão com banco

**Solução:** Verificar `.env` e credenciais do banco de dados

### Problema: Porta não configurada

**Solução:** Verificar se `PORT_SERVER` está definido no `.env` ou se a KingHost está configurando automaticamente

---

## 📝 RESUMO RÁPIDO

### Local:
```powershell
cd frontend; npm run build; cd ..
cd backend; npm run build; cd ..
```

### Upload para KingHost:
- `backend/dist/` → `apps_nodejs/crm/dist/`
- `frontend/dist/` → `apps_nodejs/crm/frontend/dist/`
- `backend/server.js` → `apps_nodejs/crm/server.js`
- `backend/package.json` → `apps_nodejs/crm/package.json`
- Criar/editar `.env` em `apps_nodejs/crm/.env`

### KingHost:
```bash
cd apps_nodejs/crm
npm install --production
# Reiniciar aplicação no painel
```

---

**Pronto!** 🎉




