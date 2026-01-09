# 🔧 Solução: Erro de Timeout no Login (ERR_CONNECTION_TIMED_OUT)

## 🔍 Diagnóstico

O erro `ERR_CONNECTION_TIMED_OUT` ocorre porque:
- O frontend está tentando acessar: `http://www.crmcc.kinghost.net:21008/api/auth/login`
- A porta **21008 não está acessível externamente** (é uma porta interna)
- Na KingHost, o backend Node.js roda internamente e precisa de **proxy reverso**

---

## ✅ SOLUÇÃO 1: Configurar Proxy Reverso (Recomendado)

O Apache/Nginx deve redirecionar requisições `/api` para o backend na porta 21008.

### Opção A: Usar .htaccess (Apache)

Crie ou edite o arquivo `/www/.htaccess`:

```apache
# Configuração para SPA (React Router)
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Proxy reverso para API - redireciona /api para backend na porta 21008
  RewriteCond %{REQUEST_URI} ^/api
  RewriteRule ^api/(.*)$ http://localhost:21008/api/$1 [P,L]
  
  # Para rotas do frontend (SPA)
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Configurações de cache
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>
```

**⚠️ IMPORTANTE:** O módulo `mod_proxy` precisa estar habilitado no Apache. Se não funcionar, use a Opção B.

### Opção B: Configurar no Painel da KingHost

1. Acesse o painel da KingHost
2. Vá em **Configurações do Site** ou **Apache/Nginx**
3. Procure por **Proxy Reverso** ou **Rewrite Rules**
4. Adicione a regra:

**Para Apache:**
```apache
ProxyPass /api http://localhost:21008/api
ProxyPassReverse /api http://localhost:21008/api
```

**Para Nginx:**
```nginx
location /api {
    proxy_pass http://localhost:21008/api;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

---

## ✅ SOLUÇÃO 2: Atualizar Frontend para Usar Mesma Origem

Se não conseguir configurar proxy reverso, atualize o frontend para não usar a porta diretamente.

### Passo 1: Criar `.env.production` no Frontend

Crie o arquivo `frontend/.env.production`:

```env
VITE_API_URL=http://www.crmcc.kinghost.net
```

**Ou se usar HTTPS:**
```env
VITE_API_URL=https://www.crmcc.kinghost.net
```

### Passo 2: Recompilar Frontend

```powershell
cd frontend
npm run build
```

### Passo 3: Fazer Upload do Novo Build

Faça upload da pasta `frontend/dist/` atualizada para `/www/`

### Passo 4: Configurar Proxy Reverso (Ainda Necessário)

Mesmo assim, você ainda precisa configurar o proxy reverso para que `/api` seja redirecionado para `localhost:21008`.

---

## ✅ SOLUÇÃO 3: Usar Subdomínio para API

Se a KingHost permitir, crie um subdomínio para a API:

1. **Criar subdomínio:** `api.crmcc.kinghost.net`
2. **Configurar para apontar para a aplicação Node.js na porta 21008**
3. **Atualizar frontend:**

Crie `frontend/.env.production`:
```env
VITE_API_URL=http://api.crmcc.kinghost.net
```

Recompile e faça upload.

---

## 🔍 Verificar Qual Solução Usar

### Teste 1: Verificar se Proxy Reverso Funciona

Acesse diretamente no navegador:
```
http://www.crmcc.kinghost.net/api
```

**Se funcionar:** Proxy reverso está configurado ✅  
**Se não funcionar:** Precisa configurar proxy reverso ❌

### Teste 2: Verificar se Porta 21008 é Acessível

Tente acessar:
```
http://www.crmcc.kinghost.net:21008/api
```

**Se funcionar:** Porta está acessível (mas não é recomendado)  
**Se não funcionar:** Porta não é acessível externamente (normal) ✅

---

## 🚀 SOLUÇÃO RÁPIDA (Tente Primeiro)

### 1. Criar/Editar `.htaccess` em `/www/`

Adicione estas linhas no início do arquivo:

```apache
<IfModule mod_proxy.c>
  ProxyPass /api http://localhost:21008/api
  ProxyPassReverse /api http://localhost:21008/api
</IfModule>
```

### 2. Se Não Funcionar, Usar RewriteRule

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{REQUEST_URI} ^/api
  RewriteRule ^api/(.*)$ http://localhost:21008/api/$1 [P,L]
</IfModule>
```

### 3. Verificar se Módulos Estão Habilitados

Entre em contato com suporte da KingHost para verificar se:
- `mod_proxy` está habilitado
- `mod_rewrite` está habilitado
- `mod_proxy_http` está habilitado

### 4. Atualizar Frontend (Opcional)

Se o proxy reverso funcionar, você pode atualizar o frontend para usar a mesma origem:

1. Criar `frontend/.env.production`:
```env
VITE_API_URL=http://www.crmcc.kinghost.net
```

2. Recompilar:
```powershell
cd frontend
npm run build
```

3. Fazer upload para `/www/`

---

## 📋 Checklist

- [ ] Proxy reverso configurado (`.htaccess` ou painel)
- [ ] Módulos do Apache habilitados (`mod_proxy`, `mod_rewrite`)
- [ ] Frontend atualizado (se necessário)
- [ ] Teste: `http://www.crmcc.kinghost.net/api` funciona
- [ ] Teste: Login funciona

---

## 🐛 Troubleshooting

### Erro: "ProxyPass not allowed here"

**Solução:** Use `RewriteRule` com flag `[P]` em vez de `ProxyPass` no `.htaccess`

### Erro: "mod_proxy not enabled"

**Solução:** Entre em contato com suporte da KingHost para habilitar o módulo

### Erro: Ainda dá timeout

**Solução:**
1. Verifique se o backend está rodando: `pm2 list`
2. Verifique se está na porta 21008: `pm2 logs crm | grep Porta`
3. Teste localmente: `curl http://localhost:21008/api`

### Erro: CORS

**Solução:** Verifique se `FRONTEND_URL` no `.env` do backend inclui:
```env
FRONTEND_URL=http://www.crmcc.kinghost.net,https://www.crmcc.kinghost.net
```

---

## 💡 Dica Importante

**Na KingHost, geralmente:**
- Frontend é servido via Apache/Nginx na porta 80/443
- Backend Node.js roda internamente na porta 21008
- **SEMPRE** é necessário proxy reverso para conectar frontend ao backend

**Nunca exponha a porta 21008 diretamente!** Use sempre proxy reverso.

---

## 📚 Resumo

| Problema | Solução |
|----------|---------|
| Timeout na conexão | Configurar proxy reverso |
| Porta 21008 não acessível | Normal - usar proxy reverso |
| Frontend tenta porta direta | Atualizar para usar mesma origem |

**Conclusão:** Configure proxy reverso e está resolvido! 🎉



