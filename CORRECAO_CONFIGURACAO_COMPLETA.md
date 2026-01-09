# 🔧 Correção Completa - Configuração de Portas e Pastas

## 🔍 DIAGNÓSTICO DO PROBLEMA

Pelos logs, o backend está procurando o frontend em:
- `/apps_nodejs/crm/frontend` ❌ (sem `/dist`)
- Mas o código procura por: `/apps_nodejs/crm/frontend/dist/` ✅

**Problema:** O frontend foi copiado diretamente para `/apps_nodejs/crm/frontend/`, mas o código espera que esteja em `/apps_nodejs/crm/frontend/dist/`.

---

## ✅ SOLUÇÃO COMPLETA

### 1️⃣ CORRIGIR ESTRUTURA DE PASTAS

**Opção A: Mover arquivos para dentro de `dist/` (Recomendado)**

Via SSH ou gerenciador de arquivos:

```bash
# Criar pasta dist dentro de frontend
mkdir -p /apps_nodejs/crm/frontend/dist

# Mover arquivos para dentro de dist
mv /apps_nodejs/crm/frontend/index.html /apps_nodejs/crm/frontend/dist/
mv /apps_nodejs/crm/frontend/assets /apps_nodejs/crm/frontend/dist/
mv /apps_nodejs/crm/frontend/.htaccess /apps_nodejs/crm/frontend/dist/  # Se houver
mv /apps_nodejs/crm/frontend/package-lock.json /apps_nodejs/crm/frontend/dist/  # Se houver

# Estrutura final deve ser:
# /apps_nodejs/crm/frontend/dist/
#   ├── index.html
#   ├── assets/
#   └── .htaccess (opcional)
```

**Opção B: Usar caminho direto (Mais Simples)**

Se preferir não criar a pasta `dist/`, configure o `.env` para apontar diretamente para `/apps_nodejs/crm/frontend`.

---

### 2️⃣ CONFIGURAR `.env` DO BACKEND

Edite `/apps_nodejs/crm/.env` e adicione/verifique:

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
# ⚠️ Caminho absoluto onde o frontend está
# Se você moveu para dist/ (Opção A):
FRONTEND_DIST_PATH=/apps_nodejs/crm/frontend/dist

# OU se preferir usar direto (Opção B):
# FRONTEND_DIST_PATH=/apps_nodejs/crm/frontend

# Frontend URL (para CORS)
FRONTEND_URL=http://www.crmcc.kinghost.net,https://www.crmcc.kinghost.net,http://crmcc.kinghost.net,https://crmcc.kinghost.net
```

**⚠️ IMPORTANTE:**
- Use o caminho **absoluto completo**
- Se não souber o caminho exato, use: `/home/crmcc/apps_nodejs/crm/frontend/dist`
- Verifique qual é o caminho real com: `pwd` quando estiver em `/apps_nodejs/crm`

---

### 3️⃣ VERIFICAR ESTRUTURA FINAL

A estrutura deve estar assim:

```
/apps_nodejs/crm/
├── server.js
├── package.json
├── package-lock.json
├── .env                    ← Configurado com FRONTEND_DIST_PATH
├── dist/                   ← Backend compilado
│   └── main.js
└── frontend/
    └── dist/               ← Frontend (Opção A)
        ├── index.html
        ├── assets/
        └── .htaccess

# OU (Opção B):

/apps_nodejs/crm/
├── ...
└── frontend/               ← Frontend direto (sem dist/)
    ├── index.html
    ├── assets/
    └── .htaccess
```

---

### 4️⃣ REINICIAR BACKEND

```bash
pm2 restart crm
```

**Ou via painel da KingHost:**
- Acesse Aplicações Node.js → Reiniciar

---

### 5️⃣ VERIFICAR LOGS

```bash
pm2 logs crm --lines 50
```

**Deve mostrar:**
```
✅ Arquivo .env carregado de: /apps_nodejs/crm/.env
🔍 DEBUG - FRONTEND_DIST_PATH: /apps_nodejs/crm/frontend/dist
✅ Frontend encontrado em: /apps_nodejs/crm/frontend/dist
🚀 Backend rodando na porta 21008
🌐 Frontend disponível em http://localhost:21008/
```

**Se ainda aparecer "Frontend não encontrado":**
- Verifique o caminho exato: `ls -la /apps_nodejs/crm/frontend/dist/`
- Verifique se `index.html` existe: `ls -la /apps_nodejs/crm/frontend/dist/index.html`
- Ajuste `FRONTEND_DIST_PATH` no `.env` com o caminho absoluto correto

---

## 📋 CONFIGURAÇÃO COMPLETA DOS ARQUIVOS

### `.env` (Backend)

```env
# ⚠️ CONFIGURAÇÕES OBRIGATÓRIAS

# Database
DB_HOST=pgsql01.redehost.com.br
DB_PORT=5432
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha
DB_DATABASE=seu_banco
DB_SSL=false

# JWT
JWT_SECRET=ALTERE_PARA_UM_VALOR_SEGURO
JWT_EXPIRES_IN=24h

# Server
PORT_SERVER=21008
NODE_ENV=production

# Frontend (Caminho absoluto)
FRONTEND_DIST_PATH=/apps_nodejs/crm/frontend/dist
# OU: /home/crmcc/apps_nodejs/crm/frontend/dist

# CORS (URLs permitidas)
FRONTEND_URL=http://www.crmcc.kinghost.net,https://www.crmcc.kinghost.net,http://crmcc.kinghost.net,https://crmcc.kinghost.net
```

---

### `server.js` (Já está correto)

✅ Não precisa modificar - já está carregando `.env` corretamente

---

### `main.ts` (Já está correto)

✅ Não precisa modificar - já procura `FRONTEND_DIST_PATH` primeiro

---

### `.htaccess` (Não é necessário se backend servir frontend)

Se o backend está servindo o frontend diretamente, o `.htaccess` não é necessário.

**Mas se quiser manter em `/www/` também**, pode deixar lá.

---

## 🔍 VERIFICAÇÃO PASSO A PASSO

### 1. Verificar Estrutura de Pastas

```bash
# Verificar se frontend/dist existe
ls -la /apps_nodejs/crm/frontend/dist/

# Deve mostrar:
# index.html
# assets/
```

### 2. Verificar .env

```bash
# Verificar se FRONTEND_DIST_PATH está configurado
cat /apps_nodejs/crm/.env | grep FRONTEND_DIST_PATH

# Deve mostrar:
# FRONTEND_DIST_PATH=/apps_nodejs/crm/frontend/dist
```

### 3. Verificar Caminho Absoluto Real

```bash
# Verificar caminho absoluto real
cd /apps_nodejs/crm
pwd

# Use esse caminho no .env
# Exemplo: /home/crmcc/apps_nodejs/crm/frontend/dist
```

### 4. Testar se Arquivo Existe

```bash
# Testar se index.html existe no caminho configurado
test -f /apps_nodejs/crm/frontend/dist/index.html && echo "✅ Existe" || echo "❌ Não existe"
```

---

## 🐛 TROUBLESHOOTING

### Problema: Ainda mostra "Frontend não encontrado"

**Solução 1: Verificar caminho absoluto**

```bash
# Descobrir caminho absoluto real
realpath /apps_nodejs/crm/frontend/dist
# ou
readlink -f /apps_nodejs/crm/frontend/dist
```

Use esse caminho no `.env`.

**Solução 2: Verificar permissões**

```bash
# Verificar permissões
ls -la /apps_nodejs/crm/frontend/dist/

# Se necessário, ajustar:
chmod 755 /apps_nodejs/crm/frontend/dist
chmod 644 /apps_nodejs/crm/frontend/dist/index.html
```

**Solução 3: Verificar se .env está sendo carregado**

Nos logs, deve aparecer:
```
🔍 DEBUG - FRONTEND_DIST_PATH: /apps_nodejs/crm/frontend/dist
```

Se aparecer `NÃO DEFINIDO`, o `.env` não está sendo carregado.

---

## 📋 CHECKLIST FINAL

- [ ] Estrutura de pastas correta (`/apps_nodejs/crm/frontend/dist/`)
- [ ] `index.html` existe em `frontend/dist/`
- [ ] Pasta `assets/` existe em `frontend/dist/`
- [ ] `.env` tem `FRONTEND_DIST_PATH` configurado
- [ ] `FRONTEND_DIST_PATH` usa caminho absoluto
- [ ] `PORT_SERVER=21008` no `.env`
- [ ] `FRONTEND_URL` configurado no `.env`
- [ ] Backend reiniciado (`pm2 restart crm`)
- [ ] Logs mostram "Frontend encontrado"

---

## 🎯 RESUMO DAS CONFIGURAÇÕES

| Arquivo | Configuração | Valor |
|---------|--------------|-------|
| `.env` | `FRONTEND_DIST_PATH` | `/apps_nodejs/crm/frontend/dist` |
| `.env` | `PORT_SERVER` | `21008` |
| `.env` | `FRONTEND_URL` | `http://www.crmcc.kinghost.net,...` |
| `server.js` | ✅ Já configurado | Não precisa modificar |
| `main.ts` | ✅ Já configurado | Não precisa modificar |
| `.htaccess` | ⚠️ Opcional | Só se usar `/www/` |

---

## 💡 DICA FINAL

**Se nada funcionar, use o caminho absoluto completo:**

1. Descubra o caminho real:
   ```bash
   realpath /apps_nodejs/crm/frontend/dist
   ```

2. Use no `.env`:
   ```env
   FRONTEND_DIST_PATH=/home/crmcc/apps_nodejs/crm/frontend/dist
   ```

3. Reinicie:
   ```bash
   pm2 restart crm
   ```

**Conclusão:** O problema é a estrutura de pastas. Mova os arquivos para `frontend/dist/` ou configure o caminho correto no `.env`! 🎉



