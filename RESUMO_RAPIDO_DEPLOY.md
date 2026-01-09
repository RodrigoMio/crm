# ⚡ Resumo Rápido - Deploy KingHost

Guia ultra-condensado com apenas o essencial.

---

## 🎯 ESTRUTURA

- **Backend:** `/apps_nodejs/crm/`
- **Frontend:** `/www/`

---

## 📋 COMANDOS NA MÁQUINA LOCAL

```powershell
# 1. Build Backend
cd backend
npm install
npm run build

# 2. Build Frontend
cd ..\frontend
npm install
npm run build
```

---

## 📦 ARQUIVOS PARA COPIAR

### Backend → `/apps_nodejs/crm/`
- ✅ `backend/server.js`
- ✅ `backend/package.json`
- ✅ `backend/package-lock.json`
- ✅ `backend/dist/` (pasta completa)

### Frontend → `/www/`
- ✅ `frontend/dist/index.html`
- ✅ `frontend/dist/assets/` (pasta completa)
- ✅ Todos os outros arquivos de `frontend/dist/`

---

## ⚙️ CONFIGURAÇÃO NA KINGHOST

### 1. Criar Aplicação Node.js
- **Script:** `server.js`
- **Caminho:** `/apps_nodejs/crm`
- **Anotar a PORTA** (ex: 21008)

### 2. Criar `.env` em `/apps_nodejs/crm/.env`
```env
DB_HOST=pgsql01.redehost.com.br
DB_PORT=5432
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha
DB_DATABASE=seu_banco
DB_SSL=false
JWT_SECRET=ALTERE_PARA_UM_VALOR_SEGURO
JWT_EXPIRES_IN=24h
PORT_SERVER=21008
NODE_ENV=production
FRONTEND_URL=https://seu-dominio.com
```

### 3. Instalar Dependências (via SSH ou painel)
```bash
cd /apps_nodejs/crm
npm install --production
```

---

## 🗄️ BANCO DE DADOS (REDEHOST)

1. **Liberar IP do servidor KingHost** no firewall da Redehost
2. **Executar migrations** no banco da Redehost
3. **Criar usuário admin**

---

## ✅ VERIFICAÇÃO

### Backend
```bash
curl http://seu-backend.kinghost.net:21008/api
```

### Frontend
- Acesse a URL no navegador
- Teste login e funcionalidades

---

## 📚 DOCUMENTAÇÃO COMPLETA

Para detalhes completos, consulte:
- **`PASSO_A_PASSO_DEPLOY_KINGHOST.md`** - Guia completo e detalhado
- **`TABELA_ARQUIVOS_COPIAR.md`** - Tabela visual dos arquivos

---

## 🐛 PROBLEMAS COMUNS

| Problema | Solução |
|----------|---------|
| `dist/main.js não encontrado` | Execute `npm run build` no backend |
| Erro de conexão com banco | Libere IP do servidor KingHost no firewall da Redehost |
| CORS bloqueando | Verifique `FRONTEND_URL` no `.env` |
| Frontend não carrega | Verifique se arquivos estão em `/www/` |



