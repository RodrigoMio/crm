# 🔧 Configuração da Porta 21008

## 📋 Onde Configurar a Porta 21008

A porta **21008** deve estar configurada **APENAS no arquivo `.env`** no servidor. Os arquivos de código já estão preparados para ler essa variável automaticamente.

---

## ✅ CONFIGURAÇÃO CORRETA

### 1️⃣ Arquivo `.env` no Servidor

**Localização:** `/apps_nodejs/crm/.env`

**Adicione ou verifique esta linha:**

```env
PORT_SERVER=21008
```

**⚠️ IMPORTANTE:**
- Use `PORT_SERVER` (não `PORT`)
- A KingHost geralmente fornece a porta via `PORT_SERVER`
- Não coloque espaços antes ou depois do `=`
- Não use aspas

**Exemplo completo do `.env`:**

```env
# Database Configuration (Redehost)
DB_HOST=pgsql01.redehost.com.br
DB_PORT=5432
DB_USERNAME=seu_usuario_db
DB_PASSWORD=sua_senha_db
DB_DATABASE=seu_banco_db
DB_SSL=false

# JWT Configuration
JWT_SECRET=seu_jwt_secret_super_seguro
JWT_EXPIRES_IN=24h

# Server Configuration
PORT_SERVER=21008
NODE_ENV=production

# Frontend Configuration
FRONTEND_DIST_PATH=/www

# Frontend URL
FRONTEND_URL=https://crmcc.kinghost.net
```

---

## 🔍 Como os Arquivos Usam a Porta

### ✅ `server.js` (Já Configurado)

O arquivo `server.js` já está configurado para:
1. Ler `PORT_SERVER` do `.env`
2. Converter para `PORT` (que o NestJS usa)
3. Usar como fallback a porta 3001 se não encontrar

**Código relevante:**
```javascript
// Define a porta usando PORT_SERVER da KingHost ou PORT padrão
if (process.env.PORT_SERVER && !process.env.PORT) {
  process.env.PORT = process.env.PORT_SERVER;
}
```

**✅ Você NÃO precisa modificar este arquivo!**

---

### ✅ `main.ts` (Já Configurado)

O arquivo `main.ts` já está configurado para:
1. Ler `PORT_SERVER` primeiro
2. Se não encontrar, ler `PORT`
3. Se não encontrar nenhum, usar 3001 como fallback

**Código relevante:**
```typescript
// Usa PORT_SERVER (KingHost) ou PORT (padrão) ou 3001 como fallback
const port = process.env.PORT_SERVER || process.env.PORT || 3001;
await app.listen(port, host);
```

**✅ Você NÃO precisa modificar este arquivo!**

---

## ❌ O QUE NÃO FAZER

### ❌ NÃO coloque a porta hardcoded nos arquivos

**ERRADO:**
```javascript
// ❌ NÃO FAÇA ISSO
const port = 21008;
```

### ❌ NÃO use `PORT` no `.env` (use `PORT_SERVER`)

**ERRADO:**
```env
PORT=21008  # ❌ NÃO USE
```

**CORRETO:**
```env
PORT_SERVER=21008  # ✅ USE ESTE
```

### ❌ NÃO coloque espaços ou aspas

**ERRADO:**
```env
PORT_SERVER = 21008  # ❌ Espaços
PORT_SERVER="21008"  # ❌ Aspas
PORT_SERVER = "21008"  # ❌ Ambos
```

**CORRETO:**
```env
PORT_SERVER=21008  # ✅ Sem espaços, sem aspas
```

---

## 🔍 Verificar se Está Configurado Corretamente

### 1. Verificar `.env` no Servidor

```bash
# Via SSH
cd /apps_nodejs/crm
cat .env | grep PORT
```

**Deve mostrar:**
```
PORT_SERVER=21008
```

### 2. Verificar Logs do PM2

```bash
pm2 logs crm --lines 20
```

**Procure por:**
```
🌐 Porta: 21008
🚀 Backend rodando na porta 21008
```

### 3. Testar se Está Rodando na Porta Correta

```bash
# Testar se a API responde na porta 21008
curl http://localhost:21008/api
```

---

## 🐛 Problemas Comuns

### Problema: Porta não está sendo usada

**Sintoma:** Logs mostram porta diferente de 21008

**Solução:**
1. Verifique se `PORT_SERVER=21008` está no `.env`
2. Verifique se não há espaços ou caracteres especiais
3. Reinicie o PM2: `pm2 restart crm`

### Problema: Erro "Port already in use"

**Sintoma:** Aplicação não inicia, porta já em uso

**Solução:**
1. Verifique se outra aplicação está usando a porta 21008
2. Verifique se há múltiplas instâncias rodando: `pm2 list`
3. Pare todas as instâncias: `pm2 stop all`
4. Reinicie: `pm2 restart crm`

### Problema: Porta diferente no painel da KingHost

**Sintoma:** A KingHost mostra uma porta diferente

**Solução:**
1. **Use a porta que a KingHost forneceu!**
2. Atualize o `.env` com a porta correta
3. A KingHost pode ter mudado a porta - sempre use a que está no painel

---

## 📋 Checklist

- [ ] `PORT_SERVER=21008` está no arquivo `.env`
- [ ] Não há espaços antes ou depois do `=`
- [ ] Não há aspas ao redor do valor
- [ ] O arquivo `.env` está em `/apps_nodejs/crm/.env`
- [ ] PM2 foi reiniciado após alterar o `.env`
- [ ] Logs mostram "Backend rodando na porta 21008"
- [ ] API responde em `http://localhost:21008/api`

---

## 💡 Dica Importante

**A porta pode mudar!** Se a KingHost fornecer uma porta diferente (ex: 21009, 21010), atualize apenas o `.env`:

```env
PORT_SERVER=21009  # Use a porta que a KingHost forneceu
```

Não precisa modificar nenhum arquivo de código, apenas o `.env`!

---

## 📚 Resumo

| Onde | O Que Fazer | Exemplo |
|------|-------------|---------|
| **`.env` no servidor** | Adicionar `PORT_SERVER=21008` | `PORT_SERVER=21008` |
| **`server.js`** | ✅ Já configurado - não mexer | - |
| **`main.ts`** | ✅ Já configurado - não mexer | - |

**Conclusão:** Configure apenas no `.env` e está pronto! 🎉



