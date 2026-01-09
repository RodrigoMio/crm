# 🔍 Diagnóstico Profundo - Problema no Celular

## 🎯 PRIMEIRO: Identificar o Problema Exato

Antes de tentar mais soluções, precisamos saber **exatamente** o que está acontecendo.

---

## 📋 CHECKLIST DE DIAGNÓSTICO

### 1️⃣ Qual é o Erro Exato?

**No celular, o que acontece quando você tenta acessar?**

- [ ] Mostra página padrão da KingHost (com logo e "SERVIDOR")?
- [ ] Mostra erro 404?
- [ ] Mostra erro de CORS no console?
- [ ] A página carrega mas não faz login?
- [ ] Timeout na conexão?
- [ ] Outro erro? (descreva)

---

### 2️⃣ Qual URL o Celular Está Acessando?

**Veja a URL na barra de endereço do celular:**

- URL exata: `___________________________`
- Tem `www`? Sim / Não
- Tem porta `:21008`? Sim / Não
- É `http://` ou `https://`?

**Compare com a URL do desktop que funciona:**
- URL do desktop: `___________________________`

---

### 3️⃣ Verificar Console do Navegador (Celular)

**Se possível, abra o console do navegador no celular:**

1. No Chrome Android: Menu → Mais ferramentas → Ferramentas do desenvolvedor
2. Ou conecte o celular ao desktop e use Chrome DevTools remoto
3. Veja se há erros no console

**Erros comuns:**
- `CORS policy`
- `Failed to fetch`
- `Network error`
- `Connection refused`

---

### 4️⃣ Testar URL Direta da API

**No celular, tente acessar diretamente:**

```
http://www.crmcc.kinghost.net:21008/api
```

**O que acontece?**
- [ ] Retorna JSON (mesmo que erro 404)?
- [ ] Timeout?
- [ ] Erro de conexão?
- [ ] Página padrão da KingHost?

---

## 🔧 SOLUÇÕES ESPECÍFICAS

### Solução A: Se Mostra Página Padrão da KingHost

**Problema:** Celular está acessando URL errada ou domínio não configurado.

**Solução:**

1. **Certifique-se de que está acessando a URL correta:**
   ```
   http://www.crmcc.kinghost.net:21008
   ```

2. **Se não funcionar, verifique no painel da KingHost:**
   - O domínio está configurado para apontar para a aplicação Node.js?
   - A porta 21008 está configurada corretamente?

3. **Teste alternativo:**
   - Tente acessar pelo IP do servidor (se souber)
   - Ou use um subdomínio diferente

---

### Solução B: Se Mostra Erro de CORS

**Problema:** CORS ainda está bloqueando.

**Solução Definitiva - Tornar CORS Permissivo:**

Edite `backend/src/main.ts` e altere temporariamente:

```typescript
app.enableCors({
  origin: true,  // Permite QUALQUER origem
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

**Depois:**
1. Recompile o backend: `npm run build`
2. Faça upload da nova pasta `dist/`
3. Reinicie: `pm2 restart crm`

---

### Solução C: Se Mostra Timeout

**Problema:** Celular não consegue conectar ao servidor.

**Possíveis causas:**
1. Celular em rede diferente (4G vs WiFi)
2. Firewall bloqueando
3. Porta não acessível externamente

**Solução:**

1. **Teste se funciona na mesma rede WiFi:**
   - Conecte celular e desktop na mesma WiFi
   - Tente acessar

2. **Verifique se porta está acessível:**
   - No desktop, teste: `curl http://www.crmcc.kinghost.net:21008/api`
   - Se funcionar no desktop mas não no celular, pode ser problema de rede

---

### Solução D: Se Página Carrega mas Login Não Funciona

**Problema:** Frontend carrega mas API não responde.

**Solução:**

1. **Verificar se API está acessível:**
   - No celular, abra: `http://www.crmcc.kinghost.net:21008/api`
   - Deve retornar algo (mesmo que erro)

2. **Verificar logs do backend:**
   ```bash
   pm2 logs crm --lines 50
   ```
   - Veja se há requisições chegando do celular
   - Veja se há erros de CORS

3. **Verificar configuração do frontend:**
   - O frontend está usando a URL correta da API?
   - Verifique `frontend/src/services/api.ts`

---

## 🚀 SOLUÇÃO TEMPORÁRIA: CORS Totalmente Aberto

Se nada funcionar, vamos abrir o CORS completamente (APENAS PARA TESTE):

### 1. Editar `backend/src/main.ts`

```typescript
// Habilita CORS para o frontend
app.enableCors({
  origin: true,  // Permite QUALQUER origem
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
});
```

### 2. Recompilar

```powershell
cd backend
npm run build
```

### 3. Fazer Upload

- Faça upload da pasta `dist/` atualizada para `/apps_nodejs/crm/dist/`

### 4. Reiniciar

```bash
pm2 restart crm
```

### 5. Testar

- Acesse no celular
- Deve funcionar agora

**⚠️ IMPORTANTE:** Depois de confirmar que funciona, restrinja o CORS novamente por segurança!

---

## 🔍 VERIFICAÇÕES ADICIONAIS

### Verificar Logs em Tempo Real

```bash
# Ver logs enquanto testa no celular
pm2 logs crm --lines 0
```

**O que procurar:**
- Requisições chegando do celular?
- Erros de CORS?
- Erros de autenticação?

### Verificar Se Backend Está Rodando

```bash
pm2 list
pm2 logs crm | grep "Backend rodando"
```

### Testar API Diretamente

```bash
# No servidor
curl http://localhost:21008/api

# Deve retornar algo
```

---

## 📱 TESTE ESPECÍFICO PARA CELULAR

### Teste 1: Acessar URL Direta

No celular, acesse:
```
http://www.crmcc.kinghost.net:21008
```

**O que aparece?**
- Frontend carrega? ✅
- Página padrão da KingHost? ❌
- Erro 404? ❌
- Timeout? ❌

### Teste 2: Acessar API Direta

No celular, acesse:
```
http://www.crmcc.kinghost.net:21008/api
```

**O que aparece?**
- JSON (mesmo que erro)? ✅
- Timeout? ❌
- Erro de conexão? ❌

### Teste 3: Verificar Console

Se possível, abra o console do navegador no celular e veja os erros.

---

## 💡 DICA: Usar Chrome DevTools Remoto

Para debugar melhor no celular:

1. **No desktop, abra Chrome**
2. **Acesse:** `chrome://inspect`
3. **Conecte o celular via USB**
4. **Ative "Depuração USB" no celular**
5. **Veja o console do celular no desktop**

Isso facilita muito o debug!

---

## 📋 INFORMAÇÕES NECESSÁRIAS

Para ajudar melhor, preciso saber:

1. **Qual erro exato aparece no celular?**
2. **Qual URL o celular está acessando?**
3. **O que aparece quando acessa `http://www.crmcc.kinghost.net:21008/api` no celular?**
4. **Há erros no console do navegador do celular?**
5. **O celular está na mesma rede WiFi do desktop ou em 4G?**

---

## 🎯 PRÓXIMOS PASSOS

1. **Identifique o problema exato** (use o checklist acima)
2. **Tente a Solução Temporária** (CORS totalmente aberto)
3. **Se funcionar:** Restrinja o CORS depois
4. **Se não funcionar:** Envie as informações acima para análise mais profunda

---

## 🔧 SOLUÇÃO ALTERNATIVA: Usar Subdomínio

Se nada funcionar, considere:

1. **Criar subdomínio para API:**
   - `api.crmcc.kinghost.net` → Aplicação Node.js (porta 21008)
   - `www.crmcc.kinghost.net` → Frontend (servido pelo backend)

2. **Configurar frontend para usar subdomínio:**
   - Criar `frontend/.env.production`:
   ```env
   VITE_API_URL=http://api.crmcc.kinghost.net
   ```

3. **Recompilar e fazer upload**

Isso evita problemas de CORS e porta.

---

## 📚 Resumo

| Problema | Solução |
|----------|---------|
| Página padrão KingHost | Verificar URL e domínio |
| Erro CORS | Abrir CORS temporariamente |
| Timeout | Verificar rede e porta |
| Login não funciona | Verificar API e logs |

**Conclusão:** Primeiro identifique o problema exato, depois aplique a solução específica! 🎯



