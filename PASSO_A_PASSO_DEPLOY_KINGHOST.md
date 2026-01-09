# 🚀 Passo a Passo - Deploy na KingHost

Guia completo e objetivo para publicar o projeto CRM na KingHost, considerando a estrutura de diretórios mostrada na imagem.

---

## 📋 ESTRUTURA NA KINGHOST (Conforme Imagem)

```
/
├── apps_nodejs/
│   └── crm/              ← Backend Node.js aqui
│       ├── dist/
│       ├── node_modules/
│       └── uploads/
├── www/                  ← Frontend (arquivos estáticos) aqui
│   └── assets/
└── uploads/               ← Uploads gerais (se necessário)
```

---

## 🔧 PARTE 1: PREPARAÇÃO NA MÁQUINA LOCAL

### 1.1. Build do Backend

Execute no terminal (na raiz do projeto):

```powershell
cd backend
npm install
npm run build
```

**Verificar se o build foi bem-sucedido:**
```powershell
# Verificar se dist/main.js existe
Test-Path backend\dist\main.js
```

**Arquivos gerados:**
- ✅ `backend/dist/` (pasta completa com código compilado)
- ✅ `backend/dist/main.js` (arquivo principal)

---

### 1.2. Build do Frontend

Execute no terminal:

```powershell
cd frontend
npm install
npm run build
```

**Verificar se o build foi bem-sucedido:**
```powershell
# Verificar se dist/index.html existe
Test-Path frontend\dist\index.html
```

**Arquivos gerados:**
- ✅ `frontend/dist/index.html`
- ✅ `frontend/dist/assets/` (pasta com JS, CSS e outros assets)

---

## 📦 PARTE 2: ARQUIVOS A COPIAR (ORIGEM → DESTINO)

### 2.1. Backend - Arquivos para `/apps_nodejs/crm/`

| Arquivo/Pasta | Origem Local | Destino KingHost |
|---------------|--------------|------------------|
| `server.js` | `C:\Users\rjmio\projetos-cursor\CRM\backend\server.js` | `/apps_nodejs/crm/server.js` |
| `package.json` | `C:\Users\rjmio\projetos-cursor\CRM\backend\package.json` | `/apps_nodejs/crm/package.json` |
| `package-lock.json` | `C:\Users\rjmio\projetos-cursor\CRM\backend\package-lock.json` | `/apps_nodejs/crm/package-lock.json` |
| `dist/` (pasta completa) | `C:\Users\rjmio\projetos-cursor\CRM\backend\dist\` | `/apps_nodejs/crm/dist/` |

**⚠️ IMPORTANTE:**
- Envie a pasta `dist/` COMPLETA, não apenas o arquivo `main.js`
- Todos os subdiretórios dentro de `dist/` devem ser copiados

---

### 2.2. Frontend - Arquivos para `/www/`

| Arquivo/Pasta | Origem Local | Destino KingHost |
|---------------|--------------|------------------|
| `index.html` | `C:\Users\rjmio\projetos-cursor\CRM\frontend\dist\index.html` | `/www/index.html` |
| `assets/` (pasta completa) | `C:\Users\rjmio\projetos-cursor\CRM\frontend\dist\assets\` | `/www/assets/` |
| `.htaccess` | `C:\Users\rjmio\projetos-cursor\CRM\frontend\.htaccess` | `/www/.htaccess` |

**⚠️ IMPORTANTE:**
- Copie TODOS os arquivos dentro de `frontend/dist/` para `/www/`
- Se houver outros arquivos além de `index.html` e `assets/`, copie também
- **O arquivo `.htaccess` é OBRIGATÓRIO** para o React Router funcionar corretamente

---

## 📤 PARTE 3: MÉTODOS DE UPLOAD

### Opção A: Gerenciador de Arquivos (Painel Web) ⭐ Recomendado

1. Acesse o painel da KingHost
2. Abra o **Gerenciador de Arquivos**
3. Navegue até o diretório desejado
4. Faça upload dos arquivos

**Para pastas (dist/, assets/):**
- Compacte em ZIP no Windows
- Faça upload do ZIP
- Extraia no servidor usando o gerenciador de arquivos

---

### Opção B: FTP/SFTP

Use FileZilla, WinSCP ou similar:

1. Conecte com as credenciais FTP da KingHost
2. Arraste e solte os arquivos mantendo a estrutura
3. Para pastas, arraste a pasta inteira

---

### Opção C: SSH/SCP (Se tiver acesso SSH)

```powershell
# No PowerShell local, compactar backend
cd C:\Users\rjmio\projetos-cursor\CRM\backend
Compress-Archive -Path server.js,package.json,package-lock.json,dist -DestinationPath deploy-backend.zip

# Enviar (ajuste usuário e host)
scp deploy-backend.zip usuario@kinghost.net:/apps_nodejs/crm/

# Conectar e extrair
ssh usuario@kinghost.net
cd /apps_nodejs/crm
unzip deploy-backend.zip
```

---

## ⚙️ PARTE 4: CONFIGURAÇÃO NA KINGHOST

### 4.1. Criar Aplicação Node.js (Backend)

No painel da KingHost:

1. Acesse **Aplicações Node.js**
2. Clique em **Criar Nova Aplicação**
3. Preencha os campos:
   - **Versão do NodeJS:** `Node.JS 22 (LTS)` ou `Node.JS 20 (LTS)`
   - **Nome da Aplicação:** `CRM Backend` ou `crm-backend`
   - **Caminho da Aplicação:** `/apps_nodejs/crm` (ou o caminho exato onde você fez upload)
   - **Script:** `server.js` (ou caminho completo: `/apps_nodejs/crm/server.js`)
4. **Anote a PORTA** fornecida (ex: `21008`)
5. Salve as configurações

---

### 4.2. Criar Arquivo `.env` no Servidor

**⚠️ NÃO envie o `.env` do local!** Crie diretamente no servidor.

No gerenciador de arquivos da KingHost, crie o arquivo `/apps_nodejs/crm/.env` com o seguinte conteúdo:

```env
# Database Configuration (Redehost)
# ⚠️ O banco está na Redehost, não na KingHost
DB_HOST=pgsql01.redehost.com.br
DB_PORT=5432
DB_USERNAME=seu_usuario_db
DB_PASSWORD=sua_senha_db
DB_DATABASE=seu_banco_db
DB_SSL=false

# JWT Configuration
JWT_SECRET=ALTERE_ESTE_VALOR_PARA_UM_SECRET_SEGURO_E_UNICO
JWT_EXPIRES_IN=24h

# Server Configuration
PORT_SERVER=21008
NODE_ENV=production

# Frontend Configuration
# ⚠️ Caminho absoluto onde o frontend está hospedado na KingHost
FRONTEND_DIST_PATH=/www
# Se o caminho for diferente (ex: /home/crmcc/www), ajuste aqui

# Frontend URL (ajuste com a URL do seu frontend)
FRONTEND_URL=https://seu-dominio.com,https://www.seu-dominio.com
```

**⚠️ IMPORTANTE:**
- Substitua `PORT_SERVER=21008` pela porta fornecida pela KingHost
- Altere `JWT_SECRET` para um valor seguro (use gerador de senhas)
- **Configure `FRONTEND_DIST_PATH`** com o caminho absoluto onde o frontend está (geralmente `/www`)
- Ajuste `FRONTEND_URL` para a URL real do seu frontend
- Use as credenciais corretas do banco de dados na Redehost

---

## 🖥️ PARTE 5: COMANDOS A EXECUTAR NA KINGHOST

### 5.1. Via SSH (Se tiver acesso)

Conecte-se via SSH ao servidor da KingHost:

```bash
ssh usuario@kinghost.net
```

---

### 5.2. Instalar Dependências do Backend

```bash
cd /apps_nodejs/crm
npm install --production
```

**Isso instalará apenas as dependências de produção (sem devDependencies).**

---

### 5.3. Verificar Estrutura de Arquivos

```bash
# Verificar se os arquivos estão no lugar certo
cd /apps_nodejs/crm
ls -la

# Deve mostrar:
# - server.js
# - package.json
# - package-lock.json
# - .env
# - dist/ (pasta)

# Verificar conteúdo de dist/
ls -la dist/

# Deve mostrar main.js e outras pastas
```

---

### 5.4. Verificar Frontend

```bash
# Verificar se os arquivos do frontend estão em /www
cd /www
ls -la

# Deve mostrar:
# - index.html
# - assets/ (pasta)
```

---

### 5.5. Verificar Logs da Aplicação

No painel da KingHost:
1. Acesse **Aplicações Node.js**
2. Clique na sua aplicação
3. Acesse **Logs** ou **Visualizar Logs**
4. Verifique se há erros

**Logs esperados (sucesso):**
```
✅ Arquivo encontrado em: /apps_nodejs/crm/dist/main.js
🚀 Iniciando aplicação NestJS...
📁 Arquivo: /apps_nodejs/crm/dist/main.js
🌐 Porta: 21008
🔧 Ambiente: production
✅ Frontend encontrado em: /www
🚀 Backend rodando na porta 21008
📡 API disponível em http://localhost:21008/api
🌐 Frontend disponível em http://localhost:21008/
```

**⚠️ Se aparecer "Frontend não encontrado":**
- Verifique se `FRONTEND_DIST_PATH` está configurado corretamente no `.env`
- Verifique se o frontend existe no caminho especificado
- Consulte `SOLUCAO_ERRO_404.md` para mais detalhes

---

## 🗄️ PARTE 6: CONFIGURAÇÃO DO BANCO DE DADOS (REDEHOST)

### 6.1. Configurar Firewall/IP Whitelist na Redehost

**🔒 CRÍTICO:** O servidor da KingHost precisa ter permissão para acessar o banco na Redehost.

**Como descobrir o IP do servidor KingHost:**

1. **Via painel da KingHost:**
   - Acesse as configurações da aplicação Node.js
   - Procure por informações de rede ou IP do servidor
   - Entre em contato com o suporte se necessário

2. **Via SSH (se tiver acesso):**
   ```bash
   curl ifconfig.me
   # ou
   curl ipinfo.io/ip
   ```

**Configurar na Redehost:**

1. Acesse o painel de controle da **Redehost**
2. Localize a seção de **Firewall** ou **IP Whitelist** do seu banco PostgreSQL
3. Adicione o **IP público do servidor da KingHost** à lista de IPs permitidos
4. Salve as alterações
5. Aguarde alguns minutos para a configuração ser aplicada (pode levar até 5-10 minutos)

---

### 6.2. Executar Migrations do Banco

⚠️ **IMPORTANTE:** Execute as migrations diretamente no banco de dados da **Redehost**.

**Opção A: Via painel da Redehost (phpPgAdmin ou similar)**
1. Acesse o painel de gerenciamento do PostgreSQL na **Redehost**
2. Execute os arquivos SQL em ordem:
   - `backend/src/migrations/001-create-tables.sql`
   - `backend/src/migrations/002-alter-telefone-size.sql`
   - Outros arquivos SQL necessários

**Opção B: Via cliente PostgreSQL local**
```bash
# No seu computador local
psql -h pgsql01.redehost.com.br -U seu_usuario -d seu_banco -f backend/src/migrations/001-create-tables.sql
```

---

### 6.3. Criar Usuário Admin

**Opção A: Via script (se tiver acesso SSH na KingHost)**
```bash
cd /apps_nodejs/crm
node dist/scripts/create-admin.js
```

**Opção B: Via SQL direto no banco**
Execute no banco de dados da Redehost:
```sql
-- Use um gerador de hash bcrypt para a senha
-- Exemplo (substitua pelo hash real):
INSERT INTO users (id, nome, email, senha, perfil, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Administrador',
  'admin@exemplo.com',
  '$2b$10$...', -- Hash bcrypt da senha (gere usando ferramenta online)
  'ADMIN',
  NOW(),
  NOW()
);
```

---

## ✅ PARTE 7: TESTES E VERIFICAÇÃO

### 7.1. Testar Backend

```bash
# Teste de saúde (se tiver endpoint)
curl http://seu-backend.kinghost.net:21008/api

# Teste de login
curl -X POST http://seu-backend.kinghost.net:21008/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@exemplo.com","senha":"sua_senha"}'
```

**Ou via navegador:**
- Acesse: `http://seu-backend.kinghost.net:21008/api`

---

### 7.2. Testar Frontend

1. Acesse a URL do frontend no navegador
2. Tente fazer login
3. Verifique se as requisições estão sendo feitas corretamente
4. Teste as funcionalidades principais

**Verificar no console do navegador (F12):**
- Se há erros de CORS
- Se as requisições à API estão sendo feitas corretamente
- Se os assets estão carregando

---

### 7.3. Verificar CORS

Se houver erros de CORS:

1. Verifique se `FRONTEND_URL` no `.env` está correto
2. Inclua todas as variações da URL (com/sem www, http/https)
3. Verifique os logs do backend para ver qual origem está sendo bloqueada

**Exemplo de FRONTEND_URL:**
```env
FRONTEND_URL=https://seu-dominio.com,https://www.seu-dominio.com,http://seu-dominio.com
```

---

## 🐛 PARTE 8: TROUBLESHOOTING

### Erro: "Arquivo dist/main.js não encontrado"

**Solução:**
1. Verifique se executou `npm run build` no backend local
2. Confirme que a pasta `dist/` foi enviada para o servidor
3. Verifique os caminhos no `server.js`
4. Certifique-se de que TODA a pasta `dist/` foi enviada, não apenas `main.js`

```bash
# Verificar no servidor
cd /apps_nodejs/crm
ls -la dist/
```

---

### Erro de conexão com banco de dados

**Solução:**
1. Verifique as credenciais no arquivo `.env` (certifique-se de que são da **Redehost**)
2. **Verifique o firewall/IP whitelist na Redehost** - o IP do servidor KingHost precisa estar liberado
3. Confirme que o host está correto (ex: `pgsql01.redehost.com.br`)
4. Teste a conexão manualmente:
   ```bash
   # No servidor KingHost (se tiver acesso SSH)
   node dist/scripts/test-connection.js
   ```

---

### Erro de porta

**Solução:**
1. Verifique se `PORT_SERVER` está configurado no `.env`
2. Confirme a porta no painel da KingHost
3. Verifique se a porta não está em uso

---

### Frontend não carrega

**Solução:**
1. Verifique se os arquivos foram enviados corretamente para `/www`
2. Confirme que `index.html` está na raiz de `/www`
3. Verifique as configurações do servidor web (Apache/Nginx)
4. Verifique os logs de erro do navegador (F12)

---

### Erro 404 em rotas do frontend (React Router)

**Solução:**
Se o frontend usa React Router, você precisa configurar o servidor web para redirecionar todas as rotas para `index.html`.

**Criar arquivo `.htaccess` em `/www/` (se usar Apache):**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 📋 CHECKLIST FINAL

Use este checklist para garantir que tudo foi feito:

### ✅ Preparação Local
- [ ] Backend compilado (`npm run build` no backend)
- [ ] Frontend compilado (`npm run build` no frontend)
- [ ] Arquivos verificados localmente

### ✅ Upload
- [ ] `server.js` enviado para `/apps_nodejs/crm/`
- [ ] `package.json` enviado para `/apps_nodejs/crm/`
- [ ] `package-lock.json` enviado para `/apps_nodejs/crm/`
- [ ] Pasta `dist/` completa enviada para `/apps_nodejs/crm/dist/`
- [ ] `index.html` enviado para `/www/`
- [ ] Pasta `assets/` enviada para `/www/assets/`

### ✅ Configuração
- [ ] Aplicação Node.js criada no painel KingHost
- [ ] Campos preenchidos corretamente (porta anotada)
- [ ] Arquivo `.env` criado no servidor (`/apps_nodejs/crm/.env`)
- [ ] Dependências instaladas (`npm install --production`)

### ✅ Banco de Dados
- [ ] Credenciais do banco anotadas
- [ ] Firewall da Redehost configurado (IP do servidor KingHost liberado)
- [ ] Migrations executadas no banco da Redehost
- [ ] Usuário admin criado

### ✅ Testes
- [ ] Backend respondendo (teste via curl ou navegador)
- [ ] Frontend carregando
- [ ] Login funcionando
- [ ] Funcionalidades principais testadas

### ✅ Segurança
- [ ] JWT_SECRET alterado para valor seguro
- [ ] CORS configurado corretamente
- [ ] HTTPS configurado (se aplicável)
- [ ] Firewall da Redehost configurado

---

## 📝 RESUMO RÁPIDO DOS COMANDOS

### Na Máquina Local:
```powershell
# Build backend
cd backend
npm install
npm run build

# Build frontend
cd ..\frontend
npm install
npm run build
```

### Na KingHost (via SSH):
```bash
# Instalar dependências
cd /apps_nodejs/crm
npm install --production

# Verificar arquivos
ls -la
ls -la dist/

# Ver logs (via painel ou)
tail -f logs/app.log
```

---

## 🎉 PRONTO!

Sua aplicação deve estar funcionando na KingHost. Lembre-se de:

- Monitorar os logs regularmente
- Fazer backups do banco de dados
- Manter as dependências atualizadas
- Testar as funcionalidades após cada deploy
- Verificar a segurança periodicamente

---

## 📞 SUPORTE

Se encontrar problemas:

1. Verifique os logs da aplicação no painel da KingHost
2. Verifique os logs do servidor web (se aplicável)
3. Teste as conexões manualmente
4. Consulte a documentação da KingHost
5. Consulte a documentação da Redehost (para questões de banco)
6. Entre em contato com o suporte da KingHost se necessário

