# 🔧 Configurar Nginx na KingHost para Aplicação Node.js

## 🔍 Análise das Opções Disponíveis

A KingHost oferece configuração de **rewrite rules** do Nginx, mas **não oferece interface direta para proxy reverso**.

**Limitações:**
- As opções disponíveis são para **rewrite/redirecionamento** de URLs
- Não há opção direta para configurar `proxy_pass` (proxy reverso)
- As rewrite rules redirecionam, não fazem proxy

---

## ✅ Soluções Possíveis

### Solução 1: Usar Subdomínio Separado (Recomendado) ⭐

A melhor solução é usar um **subdomínio separado** para o backend Node.js.

**Configuração:**

1. **No painel da KingHost:**
   - Acesse **Domínios** ou **Subdomínios**
   - Crie um novo subdomínio: `api.crmcc.kinghost.net`
   - Configure para apontar para a aplicação Node.js

2. **Na aplicação Node.js:**
   - No campo **"Caminho da Aplicação"**, deixe `/` (raiz)
   - No campo **"Script"**, configure: `/home/crmcc/apps_nodejs/crm/server.js`

3. **Acesso:**
   - Frontend: `https://crmcc.kinghost.net` (pasta www)
   - Backend: `https://api.crmcc.kinghost.net/api` (aplicação Node.js)

**Vantagens:**
- ✅ Não precisa configurar proxy reverso
- ✅ Separação clara entre frontend e backend
- ✅ Mais fácil de gerenciar
- ✅ Não conflita com arquivos estáticos

---

### Solução 2: Usar Rewrite Rule para Redirecionar (Limitado)

Você pode tentar usar uma rewrite rule, mas **isso não faz proxy reverso**, apenas redireciona.

**⚠️ Limitação:** Rewrite rules redirecionam a URL, não fazem proxy. Isso significa que:
- O cliente será redirecionado para `http://localhost:21008/api`
- Isso não funcionará porque `localhost` não é acessível externamente

**Não recomendado para este caso.**

---

### Solução 3: Solicitar Configuração Manual ao Suporte

Entre em contato com o suporte da KingHost e solicite:

**"Preciso configurar proxy reverso do Nginx para minha aplicação Node.js. A aplicação está rodando na porta 21008 e preciso que as requisições para `/api` sejam encaminhadas para `http://localhost:21008/api`."**

**Configuração necessária:**
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

### Solução 4: Acessar Diretamente pela Porta (Temporário)

Enquanto não configura o proxy, você pode acessar diretamente:

```
http://crmcc.kinghost.net:21008/api
```

**Limitações:**
- Pode não funcionar se a KingHost bloquear portas externas
- Não usa HTTPS (a menos que configure)
- URL menos amigável

---

## 🎯 Recomendação: Usar Subdomínio

### Passo a Passo para Configurar Subdomínio

#### 1. Criar Subdomínio no Painel

1. Acesse o painel da KingHost
2. Vá em **Domínios** ou **Subdomínios**
3. Clique em **"Criar Subdomínio"** ou **"Adicionar Subdomínio"**
4. Configure:
   - **Nome:** `api`
   - **Domínio:** `crmcc.kinghost.net`
   - **Tipo:** Aplicação Node.js (ou similar)
   - **Aplicação:** Selecione sua aplicação Node.js

#### 2. Configurar Aplicação Node.js

1. Acesse **Aplicações Node.js**
2. Clique na sua aplicação
3. Verifique:
   - **Caminho da Aplicação:** `/` (raiz)
   - **Script:** `/home/crmcc/apps_nodejs/crm/server.js`
   - **Porta:** `21008`

#### 3. Testar

```bash
# Testar o subdomínio
curl https://api.crmcc.kinghost.net/api

# Ou no navegador
https://api.crmcc.kinghost.net/api
```

#### 4. Configurar Frontend

No arquivo `.env.production` do frontend:

```env
VITE_API_URL=https://api.crmcc.kinghost.net
```

---

## 📋 Estrutura Final Recomendada

```
Frontend (Hospedagem Web):
├── URL: https://crmcc.kinghost.net
├── Pasta: /home/crmcc/www/
└── Arquivos: index.html, assets/, etc.

Backend (Aplicação Node.js):
├── URL: https://api.crmcc.kinghost.net
├── Pasta: /home/crmcc/apps_nodejs/crm/
├── Porta: 21008
└── API: https://api.crmcc.kinghost.net/api
```

---

## 🔍 Verificações

### Verificar se o Subdomínio Está Configurado

```bash
# Testar DNS
nslookup api.crmcc.kinghost.net

# Testar acesso
curl https://api.crmcc.kinghost.net/api
```

### Verificar se a Aplicação Está Rodando

```bash
# Via SSH
ssh crmcc@nodejsng1f02
ps aux | grep node

# Testar localmente
curl http://localhost:21008/api
```

---

## ⚠️ Sobre as Rewrite Rules Disponíveis

As opções de rewrite rules que você viu são para:
- ✅ Redirecionar URLs (ex: `/old` → `/new`)
- ✅ URLs amigáveis (ex: `/post/123` → `/post.php?id=123`)
- ❌ **NÃO fazem proxy reverso**

Para fazer proxy reverso, você precisa de acesso direto ao arquivo de configuração do Nginx ou solicitar ao suporte.

---

## 💡 Alternativa: Usar o Endereço Alternativo

Vejo que há um **"Endereço alternativo"**: `http://crmcc.nodejsng1f02.kinghost.net`

Você pode tentar acessar a aplicação Node.js diretamente por este endereço:

```
http://crmcc.nodejsng1f02.kinghost.net:21008/api
```

**Teste:**
```bash
curl http://crmcc.nodejsng1f02.kinghost.net:21008/api
```

Se funcionar, você pode usar este endereço no frontend (temporariamente ou permanentemente).

---

## 📞 Próximos Passos

1. **Tente criar o subdomínio** `api.crmcc.kinghost.net` no painel
2. **Configure para apontar** para a aplicação Node.js
3. **Teste o acesso** via `https://api.crmcc.kinghost.net/api`
4. **Se não conseguir**, entre em contato com o suporte da KingHost solicitando configuração de proxy reverso

---

## ✅ Checklist

- [ ] Verificou se pode criar subdomínio no painel
- [ ] Criou subdomínio `api.crmcc.kinghost.net`
- [ ] Configurou subdomínio para apontar para aplicação Node.js
- [ ] Testou acesso via subdomínio
- [ ] Atualizou URL da API no frontend
- [ ] Verificou CORS no backend (FRONTEND_URL)

---

## 🎯 Resumo

**Problema:** Nginx está servindo arquivos estáticos ao invés da aplicação Node.js

**Solução Recomendada:** 
- Usar subdomínio separado (`api.crmcc.kinghost.net`)
- Não precisa de proxy reverso
- Mais simples e organizado

**Alternativa:**
- Solicitar ao suporte da KingHost para configurar proxy reverso manualmente










