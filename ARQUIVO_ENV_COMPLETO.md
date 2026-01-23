# 📋 Conteúdo Completo do Arquivo .env

## 📍 Localização do Arquivo

O arquivo `.env` deve estar no mesmo diretório que o `server.js`:

```
/apps_nodejs/crm/.env
```

ou

```
/home/crmcc/apps_nodejs/crm/.env
```

---

## 📝 Conteúdo Completo do .env

```env
# ============================================
# CONFIGURAÇÃO DO BANCO DE DADOS (PostgreSQL)
# ============================================
# Banco de dados PostgreSQL na Redehost
DB_HOST=pgsql01.redehost.com.br
DB_PORT=5432
DB_USERNAME=seu_usuario_do_banco
DB_PASSWORD=sua_senha_do_banco
DB_DATABASE=nome_do_seu_banco
DB_SSL=false

# ============================================
# CONFIGURAÇÃO JWT (Autenticação)
# ============================================
# Chave secreta para assinar tokens JWT
# ⚠️ IMPORTANTE: Use uma chave forte e única (mínimo 32 caracteres)
# Gere uma chave segura: openssl rand -base64 32
JWT_SECRET=sua_chave_secreta_jwt_super_segura_aqui_minimo_32_caracteres
JWT_EXPIRES_IN=24h

# ============================================
# CONFIGURAÇÃO DO SERVIDOR
# ============================================
# Porta do servidor Node.js (KingHost define via PORT_SERVER)
PORT_SERVER=21008
# Porta alternativa (usada se PORT_SERVER não estiver definido)
PORT=21008
# Ambiente de execução
NODE_ENV=production
# Host do servidor (0.0.0.0 permite acesso de qualquer IP)
HOST=0.0.0.0

# ============================================
# CONFIGURAÇÃO DO FRONTEND
# ============================================
# Caminho absoluto onde o frontend compilado está localizado
# Opção 1: Se o frontend está em /www (servido pelo Apache)
FRONTEND_DIST_PATH=/www
# Opção 2: Se o frontend está em apps_nodejs/crm/frontend/dist
# FRONTEND_DIST_PATH=/apps_nodejs/crm/frontend/dist
# Opção 3: Caminho completo com home
# FRONTEND_DIST_PATH=/home/crmcc/apps_nodejs/crm/frontend/dist

# URLs permitidas para CORS (separadas por vírgula)
# Use estas URLs se o frontend estiver sendo servido pelo Apache
FRONTEND_URL=http://www.crmcc.kinghost.net,https://www.crmcc.kinghost.net,http://crmcc.kinghost.net,https://crmcc.kinghost.net
```

---

## 📋 Explicação das Variáveis

### 🔐 Banco de Dados (PostgreSQL)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DB_HOST` | Host do servidor PostgreSQL | `pgsql01.redehost.com.br` |
| `DB_PORT` | Porta do PostgreSQL | `5432` |
| `DB_USERNAME` | Usuário do banco de dados | `seu_usuario` |
| `DB_PASSWORD` | Senha do banco de dados | `sua_senha_segura` |
| `DB_DATABASE` | Nome do banco de dados | `crm_lead` |
| `DB_SSL` | Usar SSL na conexão | `false` ou `true` |

### 🔑 Autenticação JWT

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `JWT_SECRET` | Chave secreta para assinar tokens JWT | `chave_super_segura_minimo_32_caracteres` |
| `JWT_EXPIRES_IN` | Tempo de expiração do token | `24h` (24 horas) |

### 🖥️ Servidor

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `PORT_SERVER` | Porta fornecida pela KingHost | `21008` |
| `PORT` | Porta alternativa (fallback) | `21008` |
| `NODE_ENV` | Ambiente de execução | `production` |
| `HOST` | IP do servidor | `0.0.0.0` (aceita de qualquer IP) |

### 🌐 Frontend

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `FRONTEND_DIST_PATH` | Caminho absoluto do frontend compilado | `/www` ou `/apps_nodejs/crm/frontend/dist` |
| `FRONTEND_URL` | URLs permitidas para CORS | `http://www.crmcc.kinghost.net,https://www.crmcc.kinghost.net` |

---

## ⚠️ IMPORTANTE - Segurança

1. **NUNCA** compartilhe o arquivo `.env` publicamente
2. **NUNCA** faça commit do `.env` no Git (deve estar no `.gitignore`)
3. **SEMPRE** use senhas fortes para `DB_PASSWORD` e `JWT_SECRET`
4. **GERE** uma chave JWT segura:
   ```bash
   openssl rand -base64 32
   ```

---

## 🔍 Verificação do Arquivo .env

### Via SSH na KingHost:

```bash
# Navegar para o diretório
cd /apps_nodejs/crm
# ou
cd /home/crmcc/apps_nodejs/crm

# Verificar se o arquivo existe
ls -la .env

# Ver conteúdo (cuidado: não exponha senhas!)
cat .env

# Editar o arquivo
nano .env
# Salvar: Ctrl+X, depois Y, depois Enter
```

---

## 📝 Exemplo Mínimo (Desenvolvimento Local)

Para desenvolvimento local, você pode usar valores mais simples:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=crm_lead
DB_SSL=false

# JWT
JWT_SECRET=chave_secreta_para_desenvolvimento_local
JWT_EXPIRES_IN=24h

# Server
PORT=3001
NODE_ENV=development
HOST=localhost

# Frontend (caminho relativo ou absoluto)
FRONTEND_DIST_PATH=../frontend/dist
FRONTEND_URL=http://localhost:3000
```

---

## 📝 Exemplo Produção (KingHost)

```env
# Database (Redehost)
DB_HOST=pgsql01.redehost.com.br
DB_PORT=5432
DB_USERNAME=usuario_real_do_banco
DB_PASSWORD=senha_real_do_banco
DB_DATABASE=nome_real_do_banco
DB_SSL=false

# JWT
JWT_SECRET=chave_secreta_gerada_com_openssl_rand_base64_32
JWT_EXPIRES_IN=24h

# Server
PORT_SERVER=21008
NODE_ENV=production
HOST=0.0.0.0

# Frontend
FRONTEND_DIST_PATH=/www
FRONTEND_URL=http://www.crmcc.kinghost.net,https://www.crmcc.kinghost.net,http://crmcc.kinghost.net,https://crmcc.kinghost.net
```

---

## ✅ Checklist de Configuração

- [ ] Arquivo `.env` criado no diretório correto (`/apps_nodejs/crm/`)
- [ ] Todas as variáveis de banco de dados preenchidas
- [ ] `JWT_SECRET` configurado com chave forte (mínimo 32 caracteres)
- [ ] `PORT_SERVER` configurado com a porta fornecida pela KingHost (21008)
- [ ] `FRONTEND_DIST_PATH` apontando para o caminho correto do frontend
- [ ] `FRONTEND_URL` configurado com as URLs corretas
- [ ] Arquivo `.env` não está no Git (verificar `.gitignore`)
- [ ] Permissões do arquivo: `chmod 600 .env` (apenas leitura/escrita pelo dono)

---

## 🚨 Problemas Comuns

### Problema: "Cannot find module" ou variáveis undefined

**Solução:** Verifique se o arquivo `.env` está no mesmo diretório do `server.js`

### Problema: Erro de conexão com banco de dados

**Solução:** 
- Verifique se `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD` e `DB_DATABASE` estão corretos
- Verifique se o firewall do banco permite conexões do IP do servidor
- Teste a conexão manualmente com `psql`

### Problema: Frontend não carrega (404)

**Solução:**
- Verifique se `FRONTEND_DIST_PATH` aponta para o caminho correto
- Verifique se o caminho é absoluto (começa com `/`)
- Verifique se o arquivo `index.html` existe no caminho especificado

### Problema: Erro de autenticação JWT

**Solução:**
- Verifique se `JWT_SECRET` está configurado
- Certifique-se de que a chave tem pelo menos 32 caracteres
- Não use caracteres especiais que possam causar problemas no shell





