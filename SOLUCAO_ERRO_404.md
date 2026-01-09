# 🔧 Solução para Erro 404 "Cannot GET /"

## 🔍 Diagnóstico

O erro `{"message":"Cannot GET /","error":"Not Found","statusCode":404}` indica que:
- ✅ O backend está rodando (está respondendo)
- ❌ O frontend não está sendo encontrado pelo backend
- ❌ A rota raiz `/` não está configurada corretamente

---

## 🎯 SOLUÇÃO 1: Configurar Caminho do Frontend no Backend (Recomendado)

O backend precisa saber onde está o frontend. Como na KingHost o frontend está em `/www/` e o backend em `/apps_nodejs/crm/`, precisamos configurar isso.

### Passo 1: Adicionar Variável no `.env`

Edite o arquivo `/apps_nodejs/crm/.env` e adicione:

```env
# Caminho absoluto do frontend na KingHost
FRONTEND_DIST_PATH=/www
```

**⚠️ IMPORTANTE:** Use o caminho absoluto completo. Se o caminho for diferente, ajuste conforme necessário.

### Passo 2: Verificar se o Frontend Existe

Via SSH ou gerenciador de arquivos, verifique:

```bash
# Verificar se index.html existe em /www
ls -la /www/index.html

# Verificar se assets existe
ls -la /www/assets/
```

### Passo 3: Reiniciar a Aplicação

No painel da KingHost:
1. Acesse **Aplicações Node.js**
2. Clique na sua aplicação
3. Clique em **Reiniciar** ou **Restart**

### Passo 4: Verificar Logs

Verifique os logs da aplicação. Você deve ver:

```
✅ Frontend encontrado em: /www
🌐 Frontend disponível em http://localhost:21008/
```

Se aparecer:
```
⚠️ Frontend não encontrado. Apenas a API estará disponível.
```

Significa que o caminho está errado. Verifique o caminho exato do frontend.

---

## 🎯 SOLUÇÃO 2: Configurar Proxy Reverso (Alternativa)

Se a Solução 1 não funcionar, pode ser que o domínio `crmcc.kinghost.net` esteja apontando diretamente para o Node.js, mas deveria apontar para o servidor web (Apache/Nginx) que serve `/www/`.

### Opção A: Configurar Apache/Nginx para Servir Frontend

Se você tem acesso à configuração do Apache/Nginx na KingHost:

**Para Apache (.htaccess em /www/):**
```apache
# Se o backend estiver em outra porta, configure proxy reverso
<IfModule mod_proxy.c>
  ProxyPass /api http://localhost:21008/api
  ProxyPassReverse /api http://localhost:21008/api
</IfModule>

# Serve arquivos estáticos do frontend
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

**Para Nginx:**
```nginx
location /api {
    proxy_pass http://localhost:21008/api;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

location / {
    root /www;
    try_files $uri $uri/ /index.html;
}
```

### Opção B: Copiar Frontend para Dentro do Backend

Se não conseguir configurar proxy reverso, você pode copiar o frontend para dentro do diretório do backend:

1. **Copiar frontend para `/apps_nodejs/crm/frontend/dist/`**
   - Copie `index.html` e `assets/` de `/www/` para `/apps_nodejs/crm/frontend/dist/`

2. **Estrutura ficaria:**
   ```
   /apps_nodejs/crm/
   ├── server.js
   ├── package.json
   ├── dist/
   └── frontend/
       └── dist/
           ├── index.html
           └── assets/
   ```

3. **Remover `FRONTEND_DIST_PATH` do `.env`** (o backend vai encontrar automaticamente)

4. **Reiniciar aplicação**

---

## 🎯 SOLUÇÃO 3: Verificar Configuração do Domínio

O domínio `crmcc.kinghost.net` pode estar configurado incorretamente:

### Verificar no Painel da KingHost:

1. **Acesse configurações do domínio/site**
2. **Verifique se está apontando para:**
   - ✅ `/www/` (servidor web) - **CORRETO**
   - ❌ Porta do Node.js diretamente - **ERRADO**

### Se estiver apontando para a porta do Node.js:

1. Mude para apontar para `/www/` (hospedagem web)
2. Configure proxy reverso (Solução 2 - Opção A)
3. Ou use a Solução 1 (backend serve frontend)

---

## 🔍 DIAGNÓSTICO PASSO A PASSO

### 1. Verificar se Backend Está Rodando

```bash
# Teste a API diretamente
curl http://crmcc.kinghost.net:21008/api

# Ou via navegador
http://crmcc.kinghost.net:21008/api
```

**Esperado:** Deve retornar algo (mesmo que erro 404 em rotas específicas, mas não "Cannot GET /")

### 2. Verificar se Frontend Existe

```bash
# Via SSH
ls -la /www/index.html
ls -la /www/assets/
```

**Esperado:** Arquivos devem existir

### 3. Verificar Logs do Backend

No painel da KingHost, veja os logs. Procure por:
- `✅ Frontend encontrado em: ...` (sucesso)
- `⚠️ Frontend não encontrado...` (problema)

### 4. Verificar Variáveis de Ambiente

```bash
# Via SSH (se tiver acesso)
cd /apps_nodejs/crm
cat .env | grep FRONTEND
```

**Esperado:** `FRONTEND_DIST_PATH=/www` (ou caminho correto)

---

## ✅ CHECKLIST DE VERIFICAÇÃO

- [ ] Frontend existe em `/www/index.html`
- [ ] Pasta `assets/` existe em `/www/assets/`
- [ ] Arquivo `.env` tem `FRONTEND_DIST_PATH=/www`
- [ ] Aplicação Node.js foi reiniciada após alterar `.env`
- [ ] Logs mostram "Frontend encontrado"
- [ ] Domínio está configurado corretamente

---

## 🚀 SOLUÇÃO RÁPIDA (Tente Primeiro)

1. **Adicione no `/apps_nodejs/crm/.env`:**
   ```env
   FRONTEND_DIST_PATH=/www
   ```

2. **Reinicie a aplicação** no painel da KingHost

3. **Verifique os logs** - deve aparecer "Frontend encontrado"

4. **Teste no navegador:** `http://crmcc.kinghost.net`

---

## 📞 Se Nada Funcionar

1. **Verifique os logs completos** da aplicação
2. **Teste a API diretamente:** `http://crmcc.kinghost.net:21008/api`
3. **Verifique se o domínio está apontando para o lugar certo**
4. **Entre em contato com suporte da KingHost** se necessário

---

## 💡 DICA IMPORTANTE

Na KingHost, geralmente há duas opções:

1. **Backend serve frontend** (Solução 1) - Backend procura e serve os arquivos estáticos
2. **Servidor web serve frontend + proxy para API** (Solução 2) - Apache/Nginx serve frontend e faz proxy para Node.js

A Solução 1 é mais simples e geralmente funciona melhor. Tente ela primeiro!



