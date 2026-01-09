# ⚡ Correção Rápida - Problema no Celular

## 🔍 O PROBLEMA

Aplicação funciona no desktop mas não no celular. Geralmente é problema de **CORS** ou **URL diferente**.

---

## ✅ SOLUÇÃO RÁPIDA (2 Passos)

### 1️⃣ Atualizar `.env` do Backend

Edite `/apps_nodejs/crm/.env` e atualize `FRONTEND_URL`:

```env
# Frontend URL - Inclua TODAS as variações possíveis
FRONTEND_URL=http://www.crmcc.kinghost.net,https://www.crmcc.kinghost.net,http://crmcc.kinghost.net,https://crmcc.kinghost.net,http://cc.kinghost.net,https://cc.kinghost.net
```

**⚠️ IMPORTANTE:**
- Inclua com e sem `www`
- Inclua `http://` e `https://`
- Inclua todas as variações do domínio

### 2️⃣ Reiniciar Backend

```bash
pm2 restart crm
```

---

## 🔍 VERIFICAR

### 1. Qual URL o celular está acessando?

- Veja a URL na barra de endereço do celular
- Anote a URL exata
- Adicione ao `FRONTEND_URL` se não estiver lá

### 2. Verificar se funciona

- Acesse a aplicação no celular
- Tente fazer login
- Se der erro de CORS, adicione a URL exata ao `.env`

---

## 🐛 SE AINDA NÃO FUNCIONAR

### Opção A: Tornar CORS Permissivo (Temporário)

Se precisar testar rapidamente, edite `backend/src/main.ts`:

```typescript
app.enableCors({
  origin: true,  // Permite qualquer origem (APENAS PARA TESTE)
  credentials: true,
});
```

**⚠️ ATENÇÃO:** Depois de testar, restrinja novamente por segurança!

### Opção B: Verificar URL

Certifique-se de que o celular está acessando:
- `http://www.crmcc.kinghost.net:21008`
- E não: `http://cc.kinghost.net` (página padrão da KingHost)

---

## 📋 CHECKLIST

- [ ] `FRONTEND_URL` atualizado com todas as variações
- [ ] Backend reiniciado
- [ ] URL do celular verificada
- [ ] URL do celular está no `FRONTEND_URL`
- [ ] Teste: Login funciona no celular

---

## 💡 DICA

**Se o celular mostrar página padrão da KingHost:**
- Certifique-se de que está acessando a URL correta
- Use a porta 21008 se necessário
- Configure o domínio no painel da KingHost

---

## 📚 Documentação Completa

Para mais detalhes, consulte: **`SOLUCAO_PROBLEMA_CELULAR.md`**



