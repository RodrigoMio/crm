# 🔧 Ajustar Frontend para Usar Mesma Origem

## 🔍 Problema

O frontend está fazendo requisições para uma URL diferente da origem do navegador, causando erro CORS.

**Situação atual:**
- Frontend está em: `http://www.crmcc.kinghost.net/`
- Requisição vai para: `https://crmcc.kinghost.net/api/auth/login` (diferente!)

**Problema:** Diferença de protocolo (http vs https) e hostname (com/sem www) causa erro CORS.

---

## ✅ Solução: Usar Mesma Origem

### Opção 1: Configurar VITE_API_URL (Recomendado)

**1. Criar arquivo `.env.production` no diretório `frontend/`:**

```env
# Use a mesma origem do navegador com porta do backend
VITE_API_URL=http://www.crmcc.kinghost.net:21008
```

**Ou se usar HTTPS:**
```env
VITE_API_URL=https://www.crmcc.kinghost.net:21008
```

**2. Refazer build:**

```bash
cd frontend
npm run build
```

**3. Fazer upload novamente** dos arquivos de `frontend/dist/`

---

### Opção 2: Usar Subdomínio Separado (Melhor Solução)

**1. Criar subdomínio `api.crmcc.kinghost.net` no painel da KingHost**

**2. Configurar para apontar para aplicação Node.js**

**3. No frontend, criar `.env.production`:**

```env
VITE_API_URL=https://api.crmcc.kinghost.net
```

**4. No backend, atualizar `.env`:**

```env
FRONTEND_URL=https://crmcc.kinghost.net,https://www.crmcc.kinghost.net
```

**5. Refazer build e upload**

---

### Opção 3: Configurar Proxy Reverso no Nginx

Se você conseguir configurar proxy reverso:

**Configuração do Nginx:**
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

**No frontend, usar:**
```env
VITE_API_URL=https://www.crmcc.kinghost.net
```

**No backend:**
```env
FRONTEND_URL=https://crmcc.kinghost.net,https://www.crmcc.kinghost.net
```

---

## 🔧 Correção Aplicada no Código

Atualizei o código do frontend para usar a mesma origem do navegador quando não houver `VITE_API_URL` configurado.

**Agora você precisa:**

1. **Criar `.env.production` no frontend:**
   ```env
   VITE_API_URL=http://www.crmcc.kinghost.net:21008
   ```

2. **Refazer build:**
   ```bash
   cd frontend
   npm run build
   ```

3. **Fazer upload** dos arquivos de `frontend/dist/`

---

## 📋 Passos Completos

### Passo 1: Configurar Frontend

**No seu computador:**

```bash
cd frontend

# Criar .env.production
echo "VITE_API_URL=http://www.crmcc.kinghost.net:21008" > .env.production

# Ou se usar HTTPS:
# echo "VITE_API_URL=https://www.crmcc.kinghost.net:21008" > .env.production

# Build
npm run build
```

### Passo 2: Verificar Build

```bash
# Verificar se foi gerado corretamente
ls -la frontend/dist/
```

### Passo 3: Upload

Fazer upload de todos os arquivos de `frontend/dist/` para `/home/crmcc/www/`

### Passo 4: Verificar Backend

Certifique-se de que o `.env` do backend tem:

```env
FRONTEND_URL=http://crmcc.kinghost.net,http://www.crmcc.kinghost.net,https://crmcc.kinghost.net,https://www.crmcc.kinghost.net
```

### Passo 5: Testar

1. Limpe cache do navegador (Ctrl+Shift+R)
2. Tente fazer login
3. Verifique no DevTools se a URL está correta

---

## 🎯 URL Esperada Após Correção

**No DevTools (Network), a URL deve ser:**

```
http://www.crmcc.kinghost.net:21008/api/auth/login
```

Ou, se usar subdomínio:
```
https://api.crmcc.kinghost.net/api/auth/login
```

---

## ⚠️ Importante

1. **Use o mesmo protocolo** (http ou https) que o navegador está usando
2. **Use o mesmo hostname** (com ou sem www) que aparece na barra de endereço
3. **Adicione a porta** `:21008` se não houver proxy reverso
4. **Sempre refaça o build** após alterar `.env.production`

---

## ✅ Resumo

**Problema:** Frontend fazendo requisição para URL diferente da origem

**Solução:** 
1. Configurar `VITE_API_URL` no frontend para usar mesma origem + porta
2. Ou usar subdomínio separado
3. Refazer build e upload

**Comando rápido:**
```bash
cd frontend
echo "VITE_API_URL=http://www.crmcc.kinghost.net:21008" > .env.production
npm run build
```










