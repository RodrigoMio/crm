# ⚡ Solução Rápida - Erro de Timeout no Login

## 🔍 O Problema

Erro: `ERR_CONNECTION_TIMED_OUT` ao tentar fazer login.

**Causa:** O frontend está tentando acessar a porta 21008 diretamente, mas ela não está acessível externamente.

---

## ✅ SOLUÇÃO (2 Passos)

### 1️⃣ Atualizar `.htaccess` no Servidor

Faça upload do arquivo `.htaccess` atualizado para `/www/.htaccess`

**Origem:** `C:\Users\rjmio\projetos-cursor\CRM\frontend\.htaccess`  
**Destino:** `/www/.htaccess`

O arquivo já foi atualizado com a configuração de proxy reverso!

### 2️⃣ Recompilar e Fazer Upload do Frontend

Como o `api.ts` foi atualizado, você precisa recompilar:

```powershell
# Na sua máquina local
cd frontend
npm run build
```

**Depois faça upload da pasta `frontend/dist/` completa para `/www/`**

---

## 🔍 Verificar se Funcionou

### Teste 1: Verificar Proxy Reverso

Acesse no navegador:
```
http://www.crmcc.kinghost.net/api
```

**Deve retornar algo** (mesmo que erro 404 em rotas específicas, mas não timeout)

### Teste 2: Tentar Login

1. Acesse: `http://www.crmcc.kinghost.net`
2. Tente fazer login
3. **Não deve mais dar timeout!**

---

## 🐛 Se Ainda Não Funcionar

### Verificar se Módulos do Apache Estão Habilitados

O `.htaccess` usa `mod_proxy`. Se não funcionar:

1. **Entre em contato com suporte da KingHost** para habilitar:
   - `mod_proxy`
   - `mod_proxy_http`
   - `mod_rewrite`

2. **Ou use a alternativa no `.htaccess`:**

Descomente estas linhas no `.htaccess`:
```apache
RewriteCond %{REQUEST_URI} ^/api
RewriteRule ^api/(.*)$ http://localhost:21008/api/$1 [P,L]
```

E comente ou remova:
```apache
<IfModule mod_proxy.c>
  ...
</IfModule>
```

---

## 📋 Checklist

- [ ] `.htaccess` atualizado foi enviado para `/www/`
- [ ] Frontend foi recompilado (`npm run build`)
- [ ] Nova pasta `dist/` foi enviada para `/www/`
- [ ] Teste: `http://www.crmcc.kinghost.net/api` funciona
- [ ] Teste: Login funciona

---

## 💡 O Que Foi Alterado

### `.htaccess`
- ✅ Adicionado proxy reverso para `/api` → `localhost:21008/api`
- ✅ Mantidas configurações de SPA (React Router)
- ✅ Mantidas configurações de cache e segurança

### `api.ts`
- ✅ Removida tentativa de usar porta 21008 diretamente
- ✅ Agora usa mesma origem (assume proxy reverso)

---

## 📚 Documentação Completa

Para mais detalhes, consulte: **`SOLUCAO_ERRO_LOGIN_TIMEOUT.md`**

---

## 🎯 Resumo

**Problema:** Porta 21008 não acessível externamente  
**Solução:** Proxy reverso no Apache  
**Arquivos atualizados:** `.htaccess` e `api.ts`  
**Ação:** Fazer upload dos arquivos atualizados



