# 📋 Tabela de Arquivos para Copiar - Deploy KingHost

## 🎯 RESUMO RÁPIDO

### Backend → `/apps_nodejs/crm/`
### Frontend → `/www/`

---

## 📦 BACKEND - Arquivos para `/apps_nodejs/crm/`

| # | Arquivo/Pasta | Origem Local | Destino KingHost | Obrigatório? |
|---|---------------|--------------|------------------|--------------|
| 1 | `server.js` | `C:\Users\rjmio\projetos-cursor\CRM\backend\server.js` | `/apps_nodejs/crm/server.js` | ✅ SIM |
| 2 | `package.json` | `C:\Users\rjmio\projetos-cursor\CRM\backend\package.json` | `/apps_nodejs/crm/package.json` | ✅ SIM |
| 3 | `package-lock.json` | `C:\Users\rjmio\projetos-cursor\CRM\backend\package-lock.json` | `/apps_nodejs/crm/package-lock.json` | ✅ SIM |
| 4 | `dist/` (pasta completa) | `C:\Users\rjmio\projetos-cursor\CRM\backend\dist\` | `/apps_nodejs/crm/dist/` | ✅ SIM |
| 5 | `.env` | ❌ **NÃO COPIAR** | `/apps_nodejs/crm/.env` | ✅ SIM (criar no servidor) |

**⚠️ IMPORTANTE sobre `dist/`:**
- Copie a pasta **COMPLETA** `dist/` com todos os subdiretórios
- Não copie apenas `main.js`, copie tudo dentro de `dist/`

**Estrutura esperada em `/apps_nodejs/crm/dist/`:**
```
dist/
├── main.js
├── app.module.js
├── auth/
│   ├── auth.controller.js
│   ├── auth.service.js
│   └── ...
├── leads/
├── users/
└── ... (outras pastas)
```

---

## 🎨 FRONTEND - Arquivos para `/www/`

| # | Arquivo/Pasta | Origem Local | Destino KingHost | Obrigatório? |
|---|---------------|--------------|------------------|--------------|
| 1 | `index.html` | `C:\Users\rjmio\projetos-cursor\CRM\frontend\dist\index.html` | `/www/index.html` | ✅ SIM |
| 2 | `assets/` (pasta completa) | `C:\Users\rjmio\projetos-cursor\CRM\frontend\dist\assets\` | `/www/assets/` | ✅ SIM |
| 3 | Outros arquivos (se houver) | `C:\Users\rjmio\projetos-cursor\CRM\frontend\dist\*` | `/www/` | ⚠️ Verificar |

**⚠️ IMPORTANTE:**
- Copie **TODOS** os arquivos dentro de `frontend/dist/` para `/www/`
- Se houver outros arquivos além de `index.html` e `assets/`, copie também

**Estrutura esperada em `/www/`:**
```
www/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ... (outros assets)
└── ... (outros arquivos se houver)
```

---

## 🚫 ARQUIVOS QUE NÃO DEVEM SER COPIADOS

| Arquivo/Pasta | Motivo |
|---------------|--------|
| `node_modules/` | Será instalado no servidor com `npm install --production` |
| `.env` | Deve ser criado diretamente no servidor (contém credenciais) |
| `src/` | Código fonte não é necessário (apenas `dist/` compilado) |
| `*.ts` | Arquivos TypeScript não são necessários (apenas `.js` compilado) |
| `.git/` | Controle de versão não é necessário no servidor |
| `tsconfig.json` | Configuração de desenvolvimento não é necessária |

---

## 📝 ORDEM DE EXECUÇÃO

### 1️⃣ Na Máquina Local (Preparação)
```powershell
# Build backend
cd C:\Users\rjmio\projetos-cursor\CRM\backend
npm install
npm run build

# Build frontend
cd C:\Users\rjmio\projetos-cursor\CRM\frontend
npm install
npm run build
```

### 2️⃣ Upload dos Arquivos
1. Backend → `/apps_nodejs/crm/`
2. Frontend → `/www/`

### 3️⃣ Na KingHost (Configuração)
```bash
# Criar .env (via gerenciador de arquivos ou SSH)
# Instalar dependências
cd /apps_nodejs/crm
npm install --production
```

---

## ✅ CHECKLIST DE VERIFICAÇÃO

Após o upload, verifique:

### Backend (`/apps_nodejs/crm/`)
- [ ] `server.js` existe
- [ ] `package.json` existe
- [ ] `package-lock.json` existe
- [ ] Pasta `dist/` existe e contém `main.js`
- [ ] Arquivo `.env` foi criado (não copiado)

### Frontend (`/www/`)
- [ ] `index.html` existe
- [ ] Pasta `assets/` existe e contém arquivos JS e CSS

---

## 🔍 COMANDOS PARA VERIFICAR NO SERVIDOR

### Via SSH (se tiver acesso):
```bash
# Verificar backend
cd /apps_nodejs/crm
ls -la
ls -la dist/

# Verificar frontend
cd /www
ls -la
ls -la assets/
```

### Via Gerenciador de Arquivos (Painel Web):
- Navegue até os diretórios e verifique visualmente

---

## 💡 DICAS

1. **Para pastas grandes (`dist/`, `assets/`):**
   - Compacte em ZIP no Windows
   - Faça upload do ZIP
   - Extraia no servidor

2. **Para verificar se o build foi bem-sucedido:**
   ```powershell
   # Backend
   Test-Path backend\dist\main.js
   
   # Frontend
   Test-Path frontend\dist\index.html
   ```

3. **Se houver problemas:**
   - Verifique se todos os arquivos foram copiados
   - Verifique permissões de arquivos no servidor
   - Verifique os logs da aplicação



