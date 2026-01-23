# ⚡ Correção Rápida - PM2 Não Encontra Frontend

## 🎯 O Problema

Mesmo com `FRONTEND_DIST_PATH=/www` no `.env`, o PM2 não encontra o frontend.

---

## ✅ SOLUÇÃO (3 Passos)

### 1️⃣ Atualizar server.js no Servidor

O arquivo `server.js` foi atualizado para carregar o `.env` corretamente. 

**Faça upload do novo `server.js` para `/apps_nodejs/crm/server.js`**

**Origem:** `C:\Users\rjmio\projetos-cursor\CRM\backend\server.js`  
**Destino:** `/apps_nodejs/crm/server.js`

### 2️⃣ Verificar se index.html Existe

```bash
# Via SSH ou gerenciador de arquivos
ls -la /www/index.html
```

**Se não existir:**
- Faça upload do `index.html` de `frontend/dist/index.html` para `/www/index.html`

### 3️⃣ Recompilar e Fazer Upload do Backend

Como o `main.ts` foi atualizado, você precisa recompilar:

```powershell
# Na sua máquina local
cd backend
npm run build
```

**Depois faça upload da pasta `dist/` completa para `/apps_nodejs/crm/dist/`**

### 4️⃣ Reiniciar PM2

```bash
# Via SSH
pm2 restart crm

# Ou via painel da KingHost
# Acesse Aplicações Node.js → Reiniciar
```

---

## 🔍 Verificar se Funcionou

### Verificar Logs

```bash
pm2 logs crm --lines 50
```

**Procure por:**
```
✅ Arquivo .env carregado de: /home/crmcc/apps_nodejs/crm/.env
🔍 DEBUG - FRONTEND_DIST_PATH: /www
✅ Frontend encontrado em: /www
```

**Se aparecer `FRONTEND_DIST_PATH: NÃO DEFINIDO`:**
- Verifique se o `.env` tem a linha `FRONTEND_DIST_PATH=/www`
- Verifique se o `.env` está em `/apps_nodejs/crm/.env`

---

## 📋 Checklist

- [ ] Novo `server.js` foi enviado para o servidor
- [ ] Backend foi recompilado (`npm run build`)
- [ ] Nova pasta `dist/` foi enviada para o servidor
- [ ] `index.html` existe em `/www/index.html`
- [ ] `.env` tem `FRONTEND_DIST_PATH=/www`
- [ ] PM2 foi reiniciado
- [ ] Logs mostram "Frontend encontrado"

---

## 🐛 Se Ainda Não Funcionar

### Verificar Caminho Real

```bash
# Verificar caminho absoluto real
realpath /www
# ou
readlink -f /www
```

Se for diferente (ex: `/home/crmcc/www`), atualize o `.env`:

```env
FRONTEND_DIST_PATH=/home/crmcc/www
```

### Verificar se .env Está Sendo Carregado

```bash
# Via SSH
cd /apps_nodejs/crm
node -e "require('dotenv').config({ path: './.env' }); console.log(process.env.FRONTEND_DIST_PATH);"
```

Deve mostrar: `/www`

---

## 📚 Documentação Completa

Para mais detalhes, consulte: **`SOLUCAO_PM2_FRONTEND_NAO_ENCONTRADO.md`**






