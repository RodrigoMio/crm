# 🚀 Guia Completo de Publicação na KingHost

Este guia detalha o processo completo para publicar a aplicação CRM (backend e frontend) na KingHost.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Preparação do Backend](#preparação-do-backend)
3. [Preparação do Frontend](#preparação-do-frontend)
4. [Configuração na KingHost](#configuração-na-kinghost)
5. [Upload dos Arquivos](#upload-dos-arquivos)
6. [Configuração do Banco de Dados (Redehost)](#configuração-do-banco-de-dados-redehost)
7. [Configuração Final](#configuração-final)
8. [Troubleshooting](#troubleshooting)

---

## 📋 Pré-requisitos

- ✅ Conta na KingHost com Node.js habilitado
- ✅ Banco de dados PostgreSQL configurado na **Redehost** (serviço separado)
- ✅ Credenciais de acesso ao banco de dados PostgreSQL na Redehost
- ✅ Acesso SSH ou painel de controle da KingHost
- ✅ Domínio configurado (opcional, mas recomendado)
- ✅ Código local compilado e testado

---

## 🔧 Preparação do Backend

### 1. Build do Backend

No seu ambiente local, execute:

```bash
cd backend
npm install
npm run build
```

Isso criará a pasta `dist/` com o código compilado.

### 2. Verificar Arquivos Necessários

Certifique-se de que os seguintes arquivos existem:

- ✅ `backend/server.js` - Arquivo de inicialização
- ✅ `backend/package.json` - Dependências
- ✅ `backend/package-lock.json` - Lock file
- ✅ `backend/dist/` - Pasta com código compilado
- ✅ `backend/dist/main.js` - Arquivo principal compilado

**Verificação:**
```bash
# Verificar se dist/main.js existe
ls backend/dist/main.js
```

---

## 🎨 Preparação do Frontend

### 1. Configurar URL da API

Antes de fazer o build, você precisa configurar a URL da API do backend. 

**Opção A: Usar variável de ambiente (Recomendado)**

Crie um arquivo `.env.production` no diretório `frontend/`:

```env
VITE_API_URL=https://seu-backend.kinghost.net
```

**Opção B: O código já está preparado**

O arquivo `frontend/src/services/api.ts` já está configurado para usar variáveis de ambiente automaticamente.

### 2. Build do Frontend

Execute o build de produção:

```bash
cd frontend
npm install
npm run build
```

Isso criará a pasta `dist/` dentro de `frontend/` com os arquivos estáticos prontos para produção.

### 3. Verificar Arquivos Gerados

Após o build, você deve ter:

- ✅ `frontend/dist/index.html`
- ✅ `frontend/dist/assets/` (com JS, CSS e outros assets)
- ✅ `frontend/.htaccess` (para Apache)

---

## ⚙️ Configuração na KingHost

### 1. Criar Aplicação Node.js

No painel da KingHost:

1. Acesse **Aplicações Node.js**
2. Crie uma nova aplicação (ex: `crm-backend`)
3. **Preencha os campos do formulário:**
   - **Versão do NodeJS:** Selecione `Node.JS 22 (LTS)` ou `Node.JS 20 (LTS)`
   - **Nome da Aplicação:** `CRM Backend` ou `crm-backend`
   - **Caminho da Aplicação:** `/` (raiz - deixe vazio ou apenas `/`)
   - **Script:** Caminho completo para `server.js` (ex: `/home/crmcc/apps_nodejs/crm/server.js`)
4. Anote a porta fornecida (ex: `21008`)
5. Anote o diretório de instalação (geralmente `/apps_nodejs/crm-backend` ou `/home/crmcc/apps_nodejs/crm/`)

📖 **Para instruções detalhadas sobre como preencher cada campo, consulte:** [CONFIGURACAO_KINGHOST.md](./CONFIGURACAO_KINGHOST.md)

### 2. Obter Credenciais do Banco de Dados (Redehost)

⚠️ **IMPORTANTE:** O banco de dados PostgreSQL está hospedado na **Redehost**, não na KingHost.

1. Acesse o painel de controle da **Redehost**
2. Localize seu banco de dados PostgreSQL
3. Anote as credenciais de conexão:
   - **Host** (ex: `pgsql01.redehost.com.br`)
   - **Porta** (geralmente `5432`)
   - **Usuário**
   - **Senha**
   - **Nome do banco de dados**

### 3. Configurar Firewall/IP Whitelist na Redehost

🔒 **CRÍTICO:** O servidor da KingHost precisa ter permissão para acessar o banco na Redehost. Sem isso, a conexão será bloqueada.

**Como descobrir o IP do servidor KingHost:**

1. **Via painel da KingHost:**
   - Acesse as configurações da sua aplicação Node.js
   - Procure por informações de rede ou IP do servidor
   - Entre em contato com o suporte da KingHost se necessário

2. **Via SSH (se tiver acesso):**
   ```bash
   # Conecte-se via SSH ao servidor KingHost
   curl ifconfig.me
   # ou
   curl ipinfo.io/ip
   ```

3. **Via logs da aplicação:**
   - Após fazer o deploy, verifique os logs
   - Alguns erros de conexão podem mostrar o IP de origem

**Configurar na Redehost:**

1. Acesse o painel de controle da **Redehost**
2. Localize a seção de **Firewall** ou **IP Whitelist** do seu banco PostgreSQL
3. Adicione o **IP público do servidor da KingHost** à lista de IPs permitidos
4. Salve as alterações
5. Aguarde alguns minutos para a configuração ser aplicada (pode levar até 5-10 minutos)

**⚠️ Dica:** Se você não conseguir descobrir o IP, você pode temporariamente permitir conexões de qualquer IP (0.0.0.0/0) apenas para testar, mas **não deixe isso em produção por questões de segurança**. Depois de identificar o IP correto, restrinja o acesso apenas a ele.

### 4. Configurar Frontend (Hospedagem Web)

Para o frontend, você pode:

**Opção A: Hospedar na KingHost (Hospedagem Web)**
- Crie um site/hospedagem web
- Configure o domínio ou subdomínio
- Faça upload dos arquivos da pasta `frontend/dist/`

**Opção B: Usar outro serviço**
- Netlify
- Vercel
- GitHub Pages
- Outro serviço de hospedagem estática

---

## 📦 Upload dos Arquivos

### Arquivos para Upload do Backend

Você precisa enviar os seguintes arquivos do diretório `backend/`:

#### ✅ Arquivos Obrigatórios

1. **`server.js`** 
   - Origem: `C:\Users\rjmio\projetos-cursor\CRM\backend\server.js`
   - Destino: `/home/crmcc/apps_nodejs/crm/server.js`

2. **`package.json`**
   - Origem: `C:\Users\rjmio\projetos-cursor\CRM\backend\package.json`
   - Destino: `/home/crmcc/apps_nodejs/crm/package.json`

3. **`package-lock.json`**
   - Origem: `C:\Users\rjmio\projetos-cursor\CRM\backend\package-lock.json`
   - Destino: `/home/crmcc/apps_nodejs/crm/package-lock.json`

4. **Pasta `dist/` (COMPLETA)**
   - Origem: `C:\Users\rjmio\projetos-cursor\CRM\backend\dist\` (pasta completa)
   - Destino: `/home/crmcc/apps_nodejs/crm/dist/` (pasta completa)
   - **Importante:** Envie a pasta inteira, não apenas `main.js`

#### ⚠️ Arquivo a Criar no Servidor

5. **`.env`**
   - Variáveis de ambiente (NÃO enviar do local)
   - Deve ser criado diretamente no servidor
   - Contém credenciais sensíveis

### Estrutura no Servidor (Após Upload)

```
/home/crmcc/apps_nodejs/crm/
├── server.js              ✅ Upload feito
├── package.json           ✅ Upload feito
├── package-lock.json      ✅ Upload feito
├── .env                   ✅ Criar manualmente no servidor
└── dist/                   ✅ Upload feito (pasta completa)
    ├── main.js
    ├── app.module.js
    ├── auth/
    │   ├── auth.controller.js
    │   ├── auth.service.js
    │   └── ...
    ├── leads/
    ├── users/
    └── ...
```

### Métodos de Upload

**Método 1: Gerenciador de Arquivos (Painel Web)** ⭐ Recomendado
- Acesse o Gerenciador de Arquivos no painel da KingHost
- Navegue até o diretório da aplicação
- Faça upload dos arquivos individualmente
- Para a pasta `dist/`, compacte em ZIP, faça upload e extraia

**Método 2: FTP/SFTP**
- Use FileZilla, WinSCP ou similar
- Conecte com as credenciais FTP da KingHost
- Arraste e solte os arquivos mantendo a estrutura

**Método 3: SSH/SCP**
```bash
# Compactar
tar -czf deploy.tar.gz server.js package.json package-lock.json dist/

# Enviar
scp deploy.tar.gz usuario@kinghost.net:/home/usuario/apps_nodejs/crm/

# Conectar e extrair
ssh usuario@kinghost.net
cd /home/usuario/apps_nodejs/crm/
tar -xzf deploy.tar.gz
```

📖 **Para instruções detalhadas sobre upload, consulte:** [GUIA_UPLOAD_ARQUIVOS.md](./GUIA_UPLOAD_ARQUIVOS.md) e [ORIGEM_DESTINO_ARQUIVOS.md](./ORIGEM_DESTINO_ARQUIVOS.md)

---

## 🗄️ Configuração do Banco de Dados (Redehost)

### 1. Configurar Variáveis de Ambiente

Crie o arquivo `.env` no diretório da aplicação no servidor com as seguintes variáveis:

```env
# Database Configuration (Redehost)
# ⚠️ O banco de dados está na Redehost, não na KingHost
DB_HOST=pgsql01.redehost.com.br
DB_PORT=5432
DB_USERNAME=seu_usuario_db
DB_PASSWORD=sua_senha_db
DB_DATABASE=seu_banco_db
DB_SSL=false

# JWT Configuration
JWT_SECRET=seu_jwt_secret_super_seguro_aqui_mude_em_producao
JWT_EXPIRES_IN=24h

# Server Configuration
PORT_SERVER=21008
NODE_ENV=production

# Frontend URL (ajuste com a URL do seu frontend)
FRONTEND_URL=https://seu-frontend.com,https://www.seu-frontend.com
```

**⚠️ IMPORTANTE:**
- Altere o `JWT_SECRET` para um valor seguro e único (use um gerador de senhas)
- Ajuste o `FRONTEND_URL` para a URL real do seu frontend
- Use múltiplas URLs separadas por vírgula se necessário
- A porta `PORT_SERVER` deve ser a fornecida pela KingHost

### 2. Instalar Dependências

Via SSH ou terminal do painel da KingHost, execute:

```bash
cd /home/crmcc/apps_nodejs/crm
npm install --production
```

Isso instalará apenas as dependências de produção (sem devDependencies).

### 3. Executar Migrations do Banco (Redehost)

⚠️ **IMPORTANTE:** Execute as migrations diretamente no banco de dados da **Redehost**.

**Opção A: Via painel da Redehost (phpPgAdmin ou similar)**
1. Acesse o painel de gerenciamento do PostgreSQL na **Redehost**
2. Execute os arquivos SQL em ordem:
   - `backend/src/migrations/001-create-tables.sql`
   - `backend/src/migrations/002-alter-telefone-size.sql`
   - `backend/src/migrations/fix-uuid-function.sql` (se necessário)

**Opção B: Via cliente PostgreSQL local**
```bash
# Conecte-se ao banco da Redehost usando psql
psql -h pgsql01.redehost.com.br -U seu_usuario -d seu_banco -f backend/src/migrations/001-create-tables.sql
psql -h pgsql01.redehost.com.br -U seu_usuario -d seu_banco -f backend/src/migrations/002-alter-telefone-size.sql
```

**Opção C: Via script Node.js (se tiver acesso SSH na KingHost)**
```bash
cd /home/crmcc/apps_nodejs/crm
node dist/scripts/create-database.js
```

### 4. Criar Usuário Admin

Se você tiver acesso SSH, pode executar:

```bash
cd /home/crmcc/apps_nodejs/crm
node dist/scripts/create-admin.js
```

Ou crie manualmente via SQL:

```sql
INSERT INTO users (id, nome, email, senha, role, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Administrador',
  'admin@exemplo.com',
  '$2b$10$...', -- Hash bcrypt da senha
  'admin',
  NOW(),
  NOW()
);
```

Para gerar o hash da senha, você pode usar um script Node.js temporário ou usar ferramentas online de hash bcrypt.

---

## ✅ Configuração Final

### 1. Iniciar a Aplicação

A KingHost geralmente inicia automaticamente usando o arquivo `server.js`. Verifique no painel:

- ✅ Arquivo de inicialização: `server.js`
- ✅ Comando de start: `node server.js` ou `npm start`
- ✅ Porta configurada corretamente

### 2. Verificar Logs

Acompanhe os logs da aplicação no painel da KingHost para verificar se está rodando corretamente. Você deve ver mensagens como:

```
✅ Arquivo encontrado em: /home/crmcc/apps_nodejs/crm/dist/main.js
🚀 Iniciando aplicação NestJS...
📁 Arquivo: /home/crmcc/apps_nodejs/crm/dist/main.js
🌐 Porta: 21008
🔧 Ambiente: production
🚀 Backend rodando na porta 21008
📡 API disponível em http://localhost:21008/api
```

### 3. Testar Backend

Teste se o backend está respondendo:

```bash
# Teste de saúde (se tiver endpoint)
curl https://seu-backend.kinghost.net/api

# Teste de login
curl -X POST https://seu-backend.kinghost.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@exemplo.com","senha":"sua_senha"}'
```

### 4. Testar Frontend

1. Acesse a URL do frontend no navegador
2. Tente fazer login
3. Verifique se as requisições estão sendo feitas corretamente
4. Teste as funcionalidades principais

### 5. Verificar CORS

Se houver erros de CORS, verifique:

- ✅ A variável `FRONTEND_URL` no `.env` do backend está correta
- ✅ A URL do frontend está incluída na lista de origens permitidas
- ✅ O protocolo (http/https) está correto

### 6. Configurar HTTPS

Certifique-se de que:

- ✅ O backend está acessível via HTTPS (se aplicável)
- ✅ O frontend está acessível via HTTPS
- ✅ Os certificados SSL estão configurados corretamente

---

## 🐛 Troubleshooting

### Erro: "Arquivo dist/main.js não encontrado"

**Solução:**
1. Verifique se executou `npm run build` no backend
2. Confirme que a pasta `dist/` foi enviada para o servidor
3. Verifique os caminhos no `server.js`
4. Certifique-se de que TODA a pasta `dist/` foi enviada, não apenas `main.js`

### Erro de conexão com banco de dados

**Solução:**
1. Verifique as credenciais no arquivo `.env` (certifique-se de que são da **Redehost**)
2. Confirme que o banco está acessível do servidor
3. **Verifique o firewall/IP whitelist na Redehost** - o IP do servidor KingHost precisa estar liberado
4. Teste a conexão manualmente:
   ```bash
   node dist/scripts/test-connection.js
   ```
5. Verifique se o host está correto (ex: `pgsql01.redehost.com.br`)

### Erro de porta

**Solução:**
1. Verifique se `PORT_SERVER` está configurado no `.env`
2. Confirme a porta no painel da KingHost
3. Verifique se a porta não está em uso

### CORS bloqueando requisições

**Solução:**
1. Verifique se `FRONTEND_URL` está configurado corretamente
2. Inclua todas as variações da URL (com/sem www, http/https)
3. Verifique os logs do backend para ver qual origem está sendo bloqueada

### Frontend não carrega

**Solução:**
1. Verifique se os arquivos foram enviados corretamente
2. Confirme que `index.html` está na raiz
3. Verifique as configurações do servidor web (Apache/Nginx)
4. Verifique os logs de erro do navegador (F12)

### Erro 404 em rotas do frontend

**Solução:**
1. Configure o servidor web para redirecionar todas as rotas para `index.html`
2. Isso é necessário para SPAs (Single Page Applications)
3. Use o `.htaccess` (Apache) ou configuração Nginx

### Problemas com uploads

**Solução:**
1. Verifique permissões da pasta `uploads/` no servidor
2. Certifique-se de que o servidor tem permissão de escrita
3. Verifique o caminho absoluto no código

---

## 📝 Comandos Úteis

### Backend

```bash
# Build
npm run build

# Testar conexão com banco
npm run test-connection

# Criar usuário admin
npm run create-admin

# Testar login
npm run test-login
```

### Frontend

```bash
# Build de produção
npm run build

# Preview do build
npm run preview
```

### No Servidor (SSH)

```bash
# Navegar até o diretório
cd /home/crmcc/apps_nodejs/crm

# Instalar dependências
npm install --production

# Verificar arquivos
ls -la
ls -la dist/

# Ver logs (se disponível)
tail -f logs/app.log
```

---

## 🔐 Segurança

### Checklist de Segurança

- ✅ `NODE_ENV=production` configurado
- ✅ `JWT_SECRET` alterado para valor seguro e único
- ✅ Arquivo `.env` não está no repositório (`.gitignore`)
- ✅ CORS configurado apenas para domínios permitidos
- ✅ HTTPS habilitado em produção
- ✅ Senhas do banco de dados são seguras
- ✅ Logs não expõem informações sensíveis
- ✅ Firewall da Redehost configurado corretamente

### Boas Práticas

1. **Nunca commite** o arquivo `.env`
2. **Use senhas fortes** para JWT_SECRET e banco de dados
3. **Mantenha as dependências atualizadas**
4. **Configure backups regulares** do banco de dados
5. **Monitore os logs** regularmente
6. **Use HTTPS** sempre que possível
7. **Restrinja o acesso ao banco** apenas ao IP do servidor KingHost

---

## 📚 Documentação Relacionada

Para informações mais detalhadas sobre tópicos específicos, consulte:

- **[ORIGEM_DESTINO_ARQUIVOS.md](./ORIGEM_DESTINO_ARQUIVOS.md)** - Origem e destino exatos de cada arquivo
- **[GUIA_UPLOAD_ARQUIVOS.md](./GUIA_UPLOAD_ARQUIVOS.md)** - Métodos detalhados de upload
- **[CONFIGURACAO_KINGHOST.md](./CONFIGURACAO_KINGHOST.md)** - Como preencher os campos no painel
- **[backend/DEPLOY_KINGHOST.md](./backend/DEPLOY_KINGHOST.md)** - Guia específico do backend
- **[RESUMO_DEPLOY.md](./RESUMO_DEPLOY.md)** - Resumo rápido dos passos essenciais

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs da aplicação no painel da KingHost
2. Verifique os logs do servidor web (se aplicável)
3. Teste as conexões manualmente
4. Consulte a documentação da KingHost
5. Consulte a documentação da Redehost (para questões de banco)
6. Entre em contato com o suporte da KingHost se necessário

---

## 🎉 Pronto!

Sua aplicação deve estar funcionando na KingHost. Lembre-se de:

- Monitorar os logs regularmente
- Fazer backups do banco de dados
- Manter as dependências atualizadas
- Testar as funcionalidades após cada deploy
- Verificar a segurança periodicamente

---

## 📋 Checklist Final

Use este checklist para garantir que tudo foi feito:

### Preparação
- [ ] Backend compilado (`npm run build`)
- [ ] Frontend compilado (`npm run build`)
- [ ] Arquivos verificados localmente

### Upload
- [ ] `server.js` enviado
- [ ] `package.json` enviado
- [ ] `package-lock.json` enviado
- [ ] Pasta `dist/` completa enviada

### Configuração
- [ ] Aplicação criada no painel KingHost
- [ ] Campos preenchidos corretamente
- [ ] Arquivo `.env` criado no servidor
- [ ] Dependências instaladas (`npm install --production`)

### Banco de Dados
- [ ] Credenciais do banco anotadas
- [ ] Firewall da Redehost configurado
- [ ] Migrations executadas
- [ ] Usuário admin criado

### Testes
- [ ] Backend respondendo
- [ ] Frontend carregando
- [ ] Login funcionando
- [ ] Funcionalidades principais testadas

### Segurança
- [ ] JWT_SECRET alterado
- [ ] CORS configurado
- [ ] HTTPS configurado
- [ ] Firewall configurado










