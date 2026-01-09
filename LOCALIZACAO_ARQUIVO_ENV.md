# 📍 Localização do Arquivo .env na KingHost

## ✅ Onde deve estar o arquivo `.env`

O arquivo `.env` deve estar **no mesmo diretório** que o `server.js`.

### Estrutura na KingHost:

```
/home/crmcc/apps_nodejs/crm/
├── .env                    ← AQUI (mesmo nível que server.js)
├── server.js               ← AQUI
├── package.json
├── dist/
│   ├── main.js
│   └── ...
└── frontend/
    └── dist/
        └── ...
```

**Caminho completo:**
```
/home/crmcc/apps_nodejs/crm/.env
```

---

## 🔍 Como o server.js procura o .env

O `server.js` usa `__dirname` para encontrar o arquivo:

```javascript
const envPath = path.join(__dirname, '.env');
```

Isso significa que ele procura o `.env` no **mesmo diretório** onde o `server.js` está sendo executado.

---

## ✅ Verificação

### Via SSH:

```bash
# Navegar para o diretório
cd /home/crmcc/apps_nodejs/crm

# Verificar se .env existe
ls -la .env

# Ver conteúdo (cuidado: não exponha senhas!)
cat .env
```

**Resultado esperado:**
```bash
-rw-r--r-- 1 crmcc crmcc 1234 Jan 15 10:00 .env
```

---

## 📝 Conteúdo Mínimo do .env

```env
# Banco de Dados PostgreSQL
DB_HOST=seu_host_postgresql
DB_PORT=5432
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha
DB_DATABASE=nome_do_banco
DB_SSL=true

# JWT Secret
JWT_SECRET=sua_chave_secreta_jwt_aqui

# Porta (KingHost define automaticamente via PORT_SERVER)
PORT_SERVER=21008

# Frontend URL (opcional - para CORS)
FRONTEND_URL=https://www.crmcc.kinghost.net

# Frontend Path (opcional - se o NestJS não encontrar automaticamente)
FRONTEND_DIST_PATH=/home/crmcc/apps_nodejs/crm/frontend/dist
```

---

## 🚨 Problemas Comuns

### Problema 1: ".env não encontrado" nos logs

**Causa:** Arquivo não está no lugar certo ou não existe.

**Solução:**
```bash
cd /home/crmcc/apps_nodejs/crm
ls -la .env
# Se não existir, criar:
nano .env
# Colar o conteúdo e salvar (Ctrl+X, Y, Enter)
```

### Problema 2: Variáveis não estão sendo carregadas

**Causa:** Arquivo existe mas está em outro lugar ou com nome errado.

**Solução:**
```bash
# Verificar onde está o server.js
cd /home/crmcc/apps_nodejs/crm
pwd
ls -la server.js

# Verificar se .env está no mesmo lugar
ls -la .env

# Se não estiver, mover ou criar no lugar certo
```

### Problema 3: Permissões incorretas

**Solução:**
```bash
# Corrigir permissões
chmod 600 .env
chown crmcc:crmcc .env
```

---

## 💡 Dica de Segurança

⚠️ **NUNCA** faça commit do arquivo `.env` no Git!

O arquivo `.env` contém informações sensíveis (senhas, tokens). Sempre:
- ✅ Adicione `.env` ao `.gitignore`
- ✅ Crie o `.env` diretamente na KingHost
- ✅ Use variáveis de ambiente do painel KingHost (se disponível)

---

## 📋 Resumo

- **Localização:** `/home/crmcc/apps_nodejs/crm/.env`
- **Mesmo diretório que:** `server.js`
- **Verificar:** `ls -la /home/crmcc/apps_nodejs/crm/.env`
- **Criar/Editar:** `nano /home/crmcc/apps_nodejs/crm/.env`

---

**Pronto!** 🎉 O arquivo `.env` deve estar no mesmo diretório que o `server.js`.


