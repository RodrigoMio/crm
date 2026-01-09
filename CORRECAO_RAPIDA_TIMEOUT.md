# ⚡ Correção Rápida - Timeout no Login

## 🔍 DIAGNÓSTICO RÁPIDO

Execute estes comandos **via SSH** para diagnosticar:

```bash
# 1. Verificar se backend está rodando
pm2 list

# 2. Verificar se responde localmente
curl http://localhost:21008/api

# 3. Verificar .htaccess
cat /www/.htaccess | grep -i proxy

# 4. Testar proxy (se configurado)
curl http://localhost/api
```

---

## ✅ SOLUÇÃO 1: Verificar Proxy Reverso

### Se o proxy não estiver funcionando:

**Edite `/www/.htaccess` e descomente as linhas de RewriteRule:**

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Descomente estas linhas:
  RewriteCond %{REQUEST_URI} ^/api
  RewriteRule ^api/(.*)$ http://localhost:21008/api/$1 [P,L]
  
  # Resto do arquivo...
</IfModule>
```

**E comente ou remova:**
```apache
<IfModule mod_proxy.c>
  ...
</IfModule>
```

---

## ✅ SOLUÇÃO 2: Backend Servir Frontend (Mais Simples)

Se o proxy não funcionar, use esta solução:

### 1. Copiar Frontend

```bash
mkdir -p /apps_nodejs/crm/frontend/dist
cp -r /www/* /apps_nodejs/crm/frontend/dist/
```

### 2. Atualizar .env

Edite `/apps_nodejs/crm/.env`:
```env
FRONTEND_DIST_PATH=/apps_nodejs/crm/frontend/dist
```

### 3. Reiniciar

```bash
pm2 restart crm
```

### 4. Configurar Domínio

No painel da KingHost, configure `www.crmcc.kinghost.net` para apontar para a aplicação Node.js na porta 21008.

---

## ✅ SOLUÇÃO 3: Verificar CORS

### Atualizar .env do Backend

Edite `/apps_nodejs/crm/.env`:
```env
FRONTEND_URL=http://www.crmcc.kinghost.net,https://www.crmcc.kinghost.net,http://crmcc.kinghost.net,https://crmcc.kinghost.net
```

### Reiniciar Backend

```bash
pm2 restart crm
```

---

## 🚀 TENTE NESTA ORDEM

1. **Verificar backend:** `pm2 list` e `curl localhost:21008/api`
2. **Se backend OK:** Tentar Solução 2 (backend servir frontend)
3. **Se ainda não funcionar:** Verificar CORS (Solução 3)
4. **Se ainda não funcionar:** Contatar suporte KingHost sobre proxy reverso

---

## 📋 CHECKLIST RÁPIDO

- [ ] Backend está rodando (`pm2 list`)
- [ ] Backend responde (`curl localhost:21008/api`)
- [ ] Frontend copiado para backend (Solução 2)
- [ ] `.env` atualizado
- [ ] Backend reiniciado
- [ ] Domínio configurado

---

## 💡 DICA

**A Solução 2 (backend servir frontend) é a mais confiável** se o proxy reverso não funcionar. Ela evita todos os problemas de proxy e CORS.



