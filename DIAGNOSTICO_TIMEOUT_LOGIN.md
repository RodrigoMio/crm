# 🔍 Diagnóstico Completo - Erro de Timeout no Login

## 🔍 Passo a Passo de Diagnóstico

### 1️⃣ Verificar se Backend Está Rodando

**Via SSH ou painel da KingHost:**

```bash
# Verificar se PM2 está rodando
pm2 list

# Verificar logs
pm2 logs crm --lines 50

# Verificar se está na porta 21008
pm2 logs crm | grep "porta\|Porta\|PORT"
```

**Deve mostrar:**
```
🚀 Backend rodando na porta 21008
```

**Se não estiver rodando:**
```bash
cd /apps_nodejs/crm
pm2 start server.js --name crm
# ou
pm2 restart crm
```

---

### 2️⃣ Testar Backend Localmente (No Servidor)

**Via SSH:**

```bash
# Testar se backend responde localmente
curl http://localhost:21008/api

# Testar endpoint de login
curl -X POST http://localhost:21008/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@teste.com","senha":"teste"}'
```

**Se funcionar:** Backend está OK ✅  
**Se não funcionar:** Problema no backend ❌

---

### 3️⃣ Verificar se Proxy Reverso Está Funcionando

**Teste 1: Via Navegador**

Acesse diretamente:
```
http://www.crmcc.kinghost.net/api
```

**Esperado:**
- Deve retornar algo (mesmo que erro 404 ou JSON)
- **NÃO deve dar timeout**

**Se der timeout:** Proxy reverso não está funcionando ❌

**Teste 2: Via SSH**

```bash
# Testar se proxy está redirecionando
curl http://localhost/api
# ou
curl http://www.crmcc.kinghost.net/api
```

---

### 4️⃣ Verificar Arquivo .htaccess

**Via SSH ou gerenciador de arquivos:**

```bash
# Verificar se .htaccess existe
ls -la /www/.htaccess

# Ver conteúdo
cat /www/.htaccess
```

**Deve conter:**
```apache
ProxyPass /api http://localhost:21008/api
# ou
RewriteRule ^api/(.*)$ http://localhost:21008/api/$1 [P,L]
```

---

### 5️⃣ Verificar Módulos do Apache

**Se o .htaccess não funcionar, pode ser que os módulos não estejam habilitados.**

**Entre em contato com suporte da KingHost** e peça para habilitar:
- `mod_proxy`
- `mod_proxy_http`
- `mod_rewrite`

**Ou use alternativa sem mod_proxy** (veja Solução Alternativa abaixo)

---

### 6️⃣ Verificar CORS no Backend

**Verificar `.env` do backend:**

```bash
cat /apps_nodejs/crm/.env | grep FRONTEND_URL
```

**Deve conter:**
```env
FRONTEND_URL=http://www.crmcc.kinghost.net,https://www.crmcc.kinghost.net,http://crmcc.kinghost.net,https://crmcc.kinghost.net
```

**Se não tiver, adicione e reinicie:**
```bash
pm2 restart crm
```

---

### 7️⃣ Verificar Logs do Apache

**Se tiver acesso aos logs do Apache:**

```bash
# Ver logs de erro do Apache
tail -f /var/log/apache2/error.log
# ou
tail -f /var/log/httpd/error_log
```

**Procure por erros relacionados a:**
- `mod_proxy`
- `ProxyPass`
- `localhost:21008`

---

## ✅ SOLUÇÕES ALTERNATIVAS

### Solução A: Usar RewriteRule em vez de ProxyPass

Se `mod_proxy` não estiver disponível, edite `/www/.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Proxy reverso para API usando RewriteRule
  RewriteCond %{REQUEST_URI} ^/api
  RewriteRule ^api/(.*)$ http://localhost:21008/api/$1 [P,L]
  
  # Para rotas do frontend (SPA)
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_URI} !^/api
  RewriteRule . /index.html [L]
</IfModule>
```

**⚠️ IMPORTANTE:** A flag `[P]` requer `mod_proxy` também. Se não funcionar, veja Solução B.

---

### Solução B: Backend Servir Frontend (Sem Proxy)

Se o proxy reverso não funcionar, faça o backend servir o frontend diretamente:

1. **Copiar frontend para dentro do backend:**

```bash
# Via SSH
mkdir -p /apps_nodejs/crm/frontend
cp -r /www/* /apps_nodejs/crm/frontend/dist/
```

2. **Atualizar `.env` do backend:**

```env
FRONTEND_DIST_PATH=/apps_nodejs/crm/frontend/dist
```

3. **Reiniciar backend:**

```bash
pm2 restart crm
```

4. **Configurar domínio para apontar para aplicação Node.js**

No painel da KingHost, configure o domínio para apontar para a aplicação Node.js na porta 21008.

---

### Solução C: Usar Subdomínio para API

1. **Criar subdomínio:** `api.crmcc.kinghost.net`
2. **Configurar para apontar para aplicação Node.js na porta 21008**
3. **Atualizar frontend:**

Crie `frontend/.env.production`:
```env
VITE_API_URL=http://api.crmcc.kinghost.net
```

Recompile e faça upload.

---

## 🚀 SOLUÇÃO RÁPIDA (Tente Nesta Ordem)

### 1. Verificar Backend

```bash
pm2 list
pm2 logs crm | grep "porta\|Porta"
curl http://localhost:21008/api
```

### 2. Verificar .htaccess

```bash
cat /www/.htaccess | grep -i proxy
```

### 3. Testar Proxy

```bash
curl http://localhost/api
```

### 4. Verificar CORS

```bash
cat /apps_nodejs/crm/.env | grep FRONTEND_URL
```

### 5. Se Nada Funcionar

Entre em contato com suporte da KingHost e pergunte:
- Como configurar proxy reverso para Node.js?
- Os módulos `mod_proxy` e `mod_rewrite` estão habilitados?
- Como fazer requisições de `www.crmcc.kinghost.net` para `localhost:21008`?

---

## 📋 Checklist de Diagnóstico

- [ ] Backend está rodando (`pm2 list`)
- [ ] Backend responde localmente (`curl localhost:21008/api`)
- [ ] `.htaccess` existe em `/www/`
- [ ] `.htaccess` tem configuração de proxy
- [ ] Proxy funciona (`curl localhost/api`)
- [ ] CORS configurado no `.env` do backend
- [ ] Módulos do Apache habilitados
- [ ] Logs do Apache verificados

---

## 💡 Dica Final

**Se o proxy reverso não funcionar na KingHost**, a solução mais simples pode ser:

1. Fazer o backend servir o frontend (Solução B)
2. Configurar o domínio para apontar diretamente para a aplicação Node.js
3. Usar apenas uma porta (21008) para tudo

Isso evita problemas de proxy reverso e CORS.






