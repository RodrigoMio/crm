# 🔧 Solução: Erro "dist/main.js não encontrado" na KingHost

## ❌ Problema

O erro indica que o arquivo `dist/main.js` não foi encontrado na KingHost. O sistema verificou:
- `/home/crmcc/apps_nodejs/crm/dist/main.js` ❌
- `/home/crmcc/apps_nodejs/crm/backend/dist/main.js` ❌
- `/home/crmcc/apps_nodejs/backend/dist/main.js` ❌

## ✅ Solução Passo a Passo

### **PASSO 1: Compilar o Backend Localmente**

Execute no seu computador (PowerShell):

```powershell
cd C:\Users\rjmio\projetos-cursor\CRM\backend
npm run build
```

**Verificar se compilou:**
```powershell
# Verificar se a pasta dist/ foi criada
dir dist\main.js
```

**Resultado esperado:** O arquivo `backend/dist/main.js` deve existir.

---

### **PASSO 2: Verificar Estrutura Local**

Após compilar, você deve ter:

```
backend/
├── dist/
│   ├── main.js          ← ESSE ARQUIVO É ESSENCIAL
│   ├── app.module.js
│   ├── auth/
│   ├── leads/
│   └── ... (outros arquivos)
├── server.js
└── package.json
```

---

### **PASSO 3: Fazer Upload para KingHost**

**Estrutura correta na KingHost:**

```
/home/crmcc/apps_nodejs/crm/
├── dist/                    ← TODA A PASTA backend/dist/
│   ├── main.js              ← DEVE ESTAR AQUI!
│   ├── app.module.js
│   ├── auth/
│   ├── leads/
│   └── ... (todos os arquivos)
├── frontend/
│   └── dist/
│       ├── index.html
│       └── assets/
├── server.js                 ← NO MESMO NÍVEL QUE dist/
├── package.json
└── .env
```

**⚠️ IMPORTANTE:**
- A pasta `dist/` deve estar **no mesmo diretório** que `server.js`
- NÃO deve ser `backend/dist/`, mas sim apenas `dist/`
- Faça upload de **TODA a pasta** `backend/dist/` para `apps_nodejs/crm/dist/`

---

### **PASSO 4: Verificar na KingHost (SSH)**

Conecte-se via SSH e execute:

```bash
# Navegar para o diretório
cd /home/crmcc/apps_nodejs/crm

# Verificar se dist/main.js existe
ls -la dist/main.js

# Se não existir, verificar estrutura
ls -la
ls -la dist/
```

**Resultado esperado:**
```bash
-rw-r--r-- 1 crmcc crmcc 12345 Jan 15 10:00 dist/main.js
```

**Se o arquivo não existir:**
- ❌ Você não fez upload da pasta `dist/`
- ❌ O upload foi feito no lugar errado
- ❌ A compilação local não gerou o arquivo

---

### **PASSO 5: Reinstalar Dependências (se necessário)**

Se você fez upload de um novo `package.json`:

```bash
cd /home/crmcc/apps_nodejs/crm
npm install --production
```

---

### **PASSO 6: Reiniciar a Aplicação**

**Opção 1: Via Painel KingHost**
- Painel → Aplicações Node.js → Selecionar "crm" → Reiniciar

**Opção 2: Via SSH (se usar PM2)**
```bash
pm2 restart crm
# ou
pm2 restart all
```

---

### **PASSO 7: Verificar Logs**

```bash
pm2 logs crm
```

**Logs esperados (sucesso):**
```
✅ Arquivo encontrado em: /home/crmcc/apps_nodejs/crm/dist/main.js
🚀 Iniciando aplicação NestJS...
📁 Arquivo: /home/crmcc/apps_nodejs/crm/dist/main.js
🌐 Porta: 3001
🔧 Ambiente: production
✅ Frontend encontrado em: /home/crmcc/apps_nodejs/crm/frontend/dist
🚀 Backend rodando na porta 3001
```

---

## 🔍 Checklist de Verificação

Antes de reiniciar, verifique:

- [ ] ✅ Compilou o backend localmente (`npm run build` no diretório `backend/`)
- [ ] ✅ Fez upload da pasta `backend/dist/` completa para `apps_nodejs/crm/dist/`
- [ ] ✅ O arquivo `dist/main.js` existe na KingHost (verificar com `ls -la dist/main.js`)
- [ ] ✅ O `server.js` está no mesmo diretório que `dist/`
- [ ] ✅ O `package.json` está atualizado
- [ ] ✅ O `.env` está configurado corretamente

---

## 🚨 Problemas Comuns

### Problema 1: "dist/main.js não encontrado" mesmo após upload

**Causa:** Upload feito no lugar errado ou estrutura incorreta.

**Solução:**
```bash
# Verificar onde está o server.js
cd /home/crmcc/apps_nodejs/crm
pwd
ls -la server.js

# Verificar se dist/ está no mesmo lugar
ls -la dist/main.js

# Se não estiver, mover ou fazer upload novamente
```

### Problema 2: Erro ao compilar localmente

**Causa:** Dependências não instaladas ou erro no código.

**Solução:**
```powershell
cd backend
npm install
npm run build
```

### Problema 3: Arquivo existe mas ainda dá erro

**Causa:** Permissões incorretas ou arquivo corrompido.

**Solução:**
```bash
# Verificar permissões
ls -la dist/main.js

# Corrigir permissões (se necessário)
chmod 644 dist/main.js
chown crmcc:crmcc dist/main.js
```

---

## 📝 Resumo Rápido

1. **Local:** `cd backend; npm run build`
2. **Upload:** `backend/dist/` → `apps_nodejs/crm/dist/` (pasta inteira)
3. **KingHost:** `ls -la dist/main.js` (verificar se existe)
4. **Reiniciar:** Painel KingHost ou `pm2 restart crm`
5. **Verificar:** `pm2 logs crm` (deve mostrar "✅ Arquivo encontrado")

---

**Pronto!** 🎉 Se ainda tiver problemas, verifique os logs com `pm2 logs crm` e compartilhe a mensagem de erro completa.





