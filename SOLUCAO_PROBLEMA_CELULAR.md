# 📱 Solução: Problema ao Acessar pelo Celular

## 🔍 DIAGNÓSTICO

O problema pode ser:
1. **CORS** - URL do celular não está permitida
2. **URL diferente** - Celular acessando sem `www` ou com porta
3. **HTTPS vs HTTP** - Protocolo diferente
4. **Domínio não configurado** - Acessando URL errada

---

## ✅ SOLUÇÃO 1: Atualizar CORS no Backend

### Atualizar `.env` do Backend

Edite `/apps_nodejs/crm/.env` e atualize `FRONTEND_URL` para incluir **TODAS** as variações possíveis:

```env
# Frontend URL (para CORS) - Inclua TODAS as variações
FRONTEND_URL=http://www.crmcc.kinghost.net,https://www.crmcc.kinghost.net,http://crmcc.kinghost.net,https://crmcc.kinghost.net,http://cc.kinghost.net,https://cc.kinghost.net
```

**⚠️ IMPORTANTE:**
- Inclua com e sem `www`
- Inclua `http://` e `https://`
- Inclua todas as variações do domínio que você usa

### Reiniciar Backend

```bash
pm2 restart crm
```

---

## ✅ SOLUÇÃO 2: Tornar CORS Mais Permissivo (Temporário)

Se ainda não funcionar, podemos tornar o CORS mais permissivo temporariamente para testar.

**⚠️ ATENÇÃO:** Isso é apenas para teste. Depois ajuste para ser mais restritivo.

### Atualizar `main.ts`

O código já permite origens da rede local (`192.168.`, `10.`, `172.`), mas podemos adicionar mais flexibilidade.

**Opção A: Permitir qualquer origem (APENAS PARA TESTE)**

Edite `backend/src/main.ts`:

```typescript
app.enableCors({
  origin: (origin, callback) => {
    // Em produção, permite qualquer origem (APENAS PARA TESTE)
    // TODO: Restringir depois para apenas domínios permitidos
    callback(null, true);
  },
  credentials: true,
});
```

**Opção B: Adicionar mais padrões (Recomendado)**

O código atual já permite IPs locais. Se o celular estiver na mesma rede, deve funcionar.

---

## ✅ SOLUÇÃO 3: Verificar URL que o Celular Está Acessando

### Verificar no Celular

1. Abra o navegador no celular
2. Acesse a aplicação
3. Veja a URL na barra de endereço
4. Anote a URL exata (com/sem www, http/https, porta, etc.)

### Adicionar URL ao CORS

Adicione a URL exata que o celular está usando no `FRONTEND_URL` do `.env`.

---

## ✅ SOLUÇÃO 4: Verificar se Está Acessando a URL Correta

### Problema Comum

O celular pode estar acessando:
- `http://cc.kinghost.net` (página padrão da KingHost)
- Em vez de: `http://www.crmcc.kinghost.net:21008` (sua aplicação)

### Solução

**Certifique-se de que o celular está acessando:**
- `http://www.crmcc.kinghost.net:21008`
- Ou a URL configurada no domínio

**Se o domínio não estiver configurado:**
- Configure o domínio no painel da KingHost para apontar para a aplicação Node.js na porta 21008

---

## ✅ SOLUÇÃO 5: Verificar Protocolo (HTTP vs HTTPS)

### Problema

Se o celular tentar acessar via HTTPS mas o servidor só aceita HTTP (ou vice-versa), pode dar erro.

### Solução

1. **Verificar qual protocolo está sendo usado:**
   - Veja a URL no celular: `http://` ou `https://`?

2. **Atualizar CORS para aceitar ambos:**
   ```env
   FRONTEND_URL=http://www.crmcc.kinghost.net,https://www.crmcc.kinghost.net,...
   ```

3. **Se usar HTTPS:**
   - Certifique-se de que o certificado SSL está configurado
   - Ou use HTTP apenas (menos seguro, mas funciona)

---

## 🔍 DIAGNÓSTICO PASSO A PASSO

### 1. Verificar URL no Celular

- Qual URL aparece na barra de endereço?
- É `http://` ou `https://`?
- Tem `www` ou não?
- Tem porta (`:21008`) ou não?

### 2. Verificar CORS nos Logs

```bash
pm2 logs crm | grep -i cors
```

Procure por erros de CORS.

### 3. Testar no Celular

1. Abra o navegador
2. Acesse a URL
3. Abra o console do navegador (se possível)
4. Veja se há erros de CORS

### 4. Verificar Console do Navegador (Desktop)

1. Abra a aplicação no desktop
2. Abra DevTools (F12)
3. Vá em Console
4. Veja se há erros de CORS
5. Compare com o que acontece no celular

---

## 🚀 SOLUÇÃO RÁPIDA (Tente Primeiro)

### 1. Atualizar `.env`

```env
FRONTEND_URL=http://www.crmcc.kinghost.net,https://www.crmcc.kinghost.net,http://crmcc.kinghost.net,https://crmcc.kinghost.net,http://cc.kinghost.net,https://cc.kinghost.net
```

### 2. Reiniciar

```bash
pm2 restart crm
```

### 3. Testar no Celular

Acesse a mesma URL que funciona no desktop.

---

## 📋 CHECKLIST

- [ ] `FRONTEND_URL` inclui todas as variações (com/sem www, http/https)
- [ ] Backend reiniciado após alterar `.env`
- [ ] Celular está acessando a URL correta
- [ ] URL do celular está na lista de `FRONTEND_URL`
- [ ] Protocolo (HTTP/HTTPS) está correto
- [ ] Domínio está configurado corretamente

---

## 🐛 PROBLEMAS COMUNS

### Problema: "CORS policy" no console do celular

**Solução:** Adicione a URL exata do celular no `FRONTEND_URL`

### Problema: Página padrão da KingHost aparece

**Solução:** Certifique-se de que está acessando a URL correta com a porta 21008

### Problema: Timeout no celular

**Solução:** Verifique se o celular está na mesma rede ou se o domínio está configurado

### Problema: Funciona no desktop mas não no celular

**Solução:** 
1. Verifique a URL exata que o celular está usando
2. Adicione ao `FRONTEND_URL`
3. Reinicie o backend

---

## 💡 DICA IMPORTANTE

**Para facilitar, você pode temporariamente permitir qualquer origem:**

No `main.ts`, altere temporariamente:

```typescript
app.enableCors({
  origin: true,  // Permite qualquer origem (APENAS PARA TESTE)
  credentials: true,
});
```

**⚠️ IMPORTANTE:** Depois de testar, restrinja novamente para apenas os domínios permitidos por segurança!

---

## 📚 Resumo

| Problema | Solução |
|----------|---------|
| CORS bloqueando | Adicionar URL do celular em `FRONTEND_URL` |
| URL diferente | Verificar URL exata e adicionar ao CORS |
| HTTPS vs HTTP | Incluir ambos no `FRONTEND_URL` |
| Página padrão | Verificar se está acessando URL correta |

**Conclusão:** O problema geralmente é CORS. Adicione todas as variações de URL no `FRONTEND_URL`! 🎉



