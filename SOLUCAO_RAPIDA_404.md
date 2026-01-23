# ⚡ Solução Rápida - Erro 404

## 🎯 O Problema

Erro: `{"message":"Cannot GET /","error":"Not Found","statusCode":404}`

**Causa:** O backend não está encontrando o frontend.

---

## ✅ SOLUÇÃO RÁPIDA (3 Passos)

### 1️⃣ Adicionar Caminho do Frontend no `.env`

Edite `/apps_nodejs/crm/.env` e adicione:

```env
FRONTEND_DIST_PATH=/www
```

### 2️⃣ Verificar se `.htaccess` Está em `/www/`

O arquivo `.htaccess` é necessário para o React Router funcionar.

**Origem:** `C:\Users\rjmio\projetos-cursor\CRM\frontend\.htaccess`
**Destino:** `/www/.htaccess`

Se não estiver lá, copie agora!

### 3️⃣ Reiniciar Aplicação

No painel da KingHost:
- Acesse **Aplicações Node.js**
- Clique em **Reiniciar**

---

## 🔍 Verificar se Funcionou

### Verificar Logs

Nos logs da aplicação, você deve ver:
```
✅ Frontend encontrado em: /www
🌐 Frontend disponível em http://localhost:21008/
```

### Testar no Navegador

Acesse: `http://crmcc.kinghost.net`

Deve carregar o frontend, não o erro 404.

---

## ❌ Se Ainda Não Funcionar

### Verificar Arquivos do Frontend

```bash
# Via SSH ou gerenciador de arquivos
ls -la /www/index.html
ls -la /www/assets/
ls -la /www/.htaccess
```

Todos devem existir!

### Verificar Caminho Correto

O caminho pode ser diferente. Verifique qual é o caminho real:

```bash
# Via SSH
pwd  # Ver onde você está
ls -la /www  # Verificar se existe
```

Se o caminho for diferente (ex: `/home/crmcc/www/`), use esse caminho no `.env`:
```env
FRONTEND_DIST_PATH=/home/crmcc/www
```

---

## 📋 Checklist

- [ ] `FRONTEND_DIST_PATH=/www` adicionado no `.env`
- [ ] `.htaccess` copiado para `/www/`
- [ ] `index.html` existe em `/www/`
- [ ] Pasta `assets/` existe em `/www/assets/`
- [ ] Aplicação reiniciada
- [ ] Logs mostram "Frontend encontrado"

---

## 📚 Documentação Completa

Para mais detalhes, consulte: **`SOLUCAO_ERRO_404.md`**






