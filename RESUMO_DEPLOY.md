# 🚀 Resumo Rápido - Deploy na KingHost

## Passos Essenciais

### 1️⃣ Preparar Backend

```bash
cd backend
npm install
npm run build
```

**Arquivos para upload:**
- `server.js`
- `package.json`
- `package-lock.json`
- `dist/` (pasta completa)

### 2️⃣ Preparar Frontend

```bash
cd frontend
npm install
npm run build
```

**Arquivos para upload:**
- Todo o conteúdo da pasta `dist/`
- `.htaccess` (para Apache)

### 3️⃣ Configurar Backend na KingHost

**Estrutura no servidor:**
```
/apps_nodejs/crm-backend/
├── server.js
├── package.json
├── package-lock.json
├── .env (criar com variáveis de ambiente)
└── dist/
```

**Arquivo .env:**
```env
# Database Configuration (Redehost)
# ⚠️ O banco está na Redehost, não na KingHost
DB_HOST=pgsql01.redehost.com.br
DB_PORT=5432
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha
DB_DATABASE=seu_banco
DB_SSL=false

JWT_SECRET=seu_secret_seguro
PORT_SERVER=21008
NODE_ENV=production
FRONTEND_URL=https://seu-frontend.com
```

**⚠️ IMPORTANTE - Configurar Firewall na Redehost:**
- Adicione o IP do servidor KingHost na whitelist do banco PostgreSQL na Redehost
- Sem isso, a conexão será bloqueada

**Comandos no servidor:**
```bash
cd /apps_nodejs/crm-backend
npm install --production
```

### 4️⃣ Configurar Frontend

- Upload dos arquivos de `frontend/dist/` para a hospedagem web
- Configurar servidor para servir `index.html` em todas as rotas
- Se usar Apache, o arquivo `.htaccess` já está configurado

### 5️⃣ Executar Migrations (na Redehost)

⚠️ Execute as migrations diretamente no banco da **Redehost**:
1. Acesse o painel da Redehost
2. Execute os arquivos SQL em ordem:
   - `backend/src/migrations/001-create-tables.sql`
   - `backend/src/migrations/002-alter-telefone-size.sql`

### 6️⃣ Criar Usuário Admin

Via SQL ou script Node.js (se tiver acesso SSH).

---

## 📖 Documentação Completa

Para instruções detalhadas, consulte:
- **[GUIA_UPLOAD_ARQUIVOS.md](./GUIA_UPLOAD_ARQUIVOS.md)** - Como fazer upload dos arquivos
- **[CONFIGURACAO_KINGHOST.md](./CONFIGURACAO_KINGHOST.md)** - Como preencher os campos no painel
- **[backend/DEPLOY_KINGHOST.md](./backend/DEPLOY_KINGHOST.md)** - Guia completo de deploy

---

## ⚡ Scripts Rápidos

**Backend (Windows):**
```powershell
.\scripts\deploy-backend.ps1
```

**Frontend (Windows):**
```powershell
.\scripts\deploy-frontend.ps1 https://seu-backend.kinghost.net
```

**Backend (Linux/Mac):**
```bash
./scripts/deploy-backend.sh
```

**Frontend (Linux/Mac):**
```bash
./scripts/deploy-frontend.sh https://seu-backend.kinghost.net
```

