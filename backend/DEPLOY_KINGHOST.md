# Deploy na KingHost - Guia de Instalação

Este guia explica como fazer o deploy do backend na KingHost.

## 📋 Pré-requisitos

1. Conta na KingHost com Node.js habilitado
2. Banco de dados PostgreSQL configurado na **Redehost** (serviço separado)
3. Credenciais de acesso ao banco de dados PostgreSQL na Redehost
4. IP do servidor KingHost liberado no firewall da Redehost
5. Acesso SSH ou painel de controle da KingHost

## 🚀 Passos para Deploy

### 1. Preparar o Código

Certifique-se de que o código está pronto para produção:

```bash
cd backend
npm install
npm run build
```

### 2. Configurar Variáveis de Ambiente

Na KingHost, configure as seguintes variáveis de ambiente no painel de controle:

```env
# Database Configuration (Redehost)
# ⚠️ O banco de dados está na Redehost, não na KingHost
DB_HOST=pgsql01.redehost.com.br
DB_PORT=5432
DB_USERNAME=user_cc_crm
DB_PASSWORD=C@nal102030
DB_DATABASE=db_cc_crm
DB_SSL=false

# JWT Configuration
JWT_SECRET=seu_jwt_secret_super_seguro_aqui_mude_em_producao
JWT_EXPIRES_IN=24h

# Server Configuration
PORT_SERVER=21008
# Ou use PORT se a KingHost não usar PORT_SERVER
PORT=21008
NODE_ENV=production

# Frontend URL (ajuste com a URL do seu frontend)
FRONTEND_URL=https://seu-dominio.com
```

**⚠️ IMPORTANTE:**
- Altere o `JWT_SECRET` para um valor seguro e único
- Ajuste o `FRONTEND_URL` para a URL do seu frontend em produção
- A porta será definida automaticamente pela KingHost (geralmente via variável `PORT`)
- **Configure o firewall da Redehost** para permitir conexões do IP do servidor KingHost

### 3. Upload dos Arquivos

Faça upload dos seguintes arquivos para o servidor da KingHost:

**Estrutura na KingHost:**
```
/apps_nodejs/crm/
├── server.js          (arquivo de inicialização)
├── package.json
├── package-lock.json
├── .env               (variáveis de ambiente)
└── dist/              (pasta com o código compilado)
    └── main.js
```

**Arquivos necessários:**
- `server.js` (arquivo de inicialização) → `/apps_nodejs/crm/`
- `package.json` → `/apps_nodejs/crm/`
- `dist/` (pasta completa com o código compilado) → `/apps_nodejs/crm/dist/`
- `.env` → `/apps_nodejs/crm/`

### 4. Instalar Dependências

Na KingHost, execute:

```bash
npm install --production
```

Isso instalará apenas as dependências de produção (sem devDependencies).

### 5. Executar Migrations (na Redehost)

⚠️ **IMPORTANTE:** Execute as migrations diretamente no banco de dados da **Redehost**.

**Opção 1: Via painel da Redehost (phpPgAdmin ou similar)**
- Acesse o painel de gerenciamento do PostgreSQL na **Redehost**
- Execute o arquivo `backend/src/migrations/001-create-tables.sql`
- Execute o arquivo `backend/src/migrations/002-alter-telefone-size.sql`

**Opção 2: Via cliente PostgreSQL local**
```bash
psql -h pgsql01.redehost.com.br -U seu_usuario -d seu_banco -f backend/src/migrations/001-create-tables.sql
```

**Opção 3: Via script (se TypeORM estiver configurado e tiver acesso SSH)**
```bash
npm run migration:run
```

### 6. Criar Usuário Admin

Execute o script para criar/atualizar o usuário admin:

```bash
npm run create-admin
```

### 7. Iniciar a Aplicação

A KingHost geralmente inicia automaticamente usando:
- O arquivo `server.js` (se existir)
- Ou o script `start` do `package.json`

**Verifique no painel da KingHost:**
- Se há opção para definir o arquivo de inicialização
- Se há opção para definir o comando de start
- Se a porta está configurada corretamente

### 8. Verificar Logs

Acompanhe os logs da aplicação no painel da KingHost para verificar se está rodando corretamente.

## 🔧 Configurações Adicionais

### CORS

O arquivo `main.ts` já está configurado para aceitar requisições do frontend. Certifique-se de que a variável `FRONTEND_URL` está configurada corretamente.

### Porta

A KingHost geralmente define a porta via variável de ambiente `PORT_SERVER` (padrão: 21008). O código está preparado para usar `PORT_SERVER` ou `PORT` como fallback.

### Uploads

A pasta `uploads/` será criada automaticamente. Certifique-se de que o servidor tem permissão de escrita nessa pasta.

## 🐛 Troubleshooting

### Erro: "Arquivo dist/main.js não encontrado"
**Solução:** Execute `npm run build` antes de fazer o deploy.

### Erro de conexão com banco de dados
**Solução:** 
1. Verifique se as variáveis de ambiente do banco estão corretas (certifique-se de que são da **Redehost**)
2. **Verifique o firewall/IP whitelist na Redehost** - o IP do servidor KingHost precisa estar liberado
3. Confirme que o host está correto (ex: `pgsql01.redehost.com.br`)
4. Teste a conexão manualmente usando `psql` ou ferramenta similar

### Erro de porta
**Solução:** Verifique se a variável `PORT` está configurada na KingHost ou se a porta padrão (3001) está disponível.

### CORS bloqueando requisições
**Solução:** Verifique se `FRONTEND_URL` está configurado corretamente com a URL do frontend.

## 📝 Comandos Úteis

```bash
# Build do projeto
npm run build

# Verificar conexão com banco
npm run test-connection

# Criar/atualizar usuário admin
npm run create-admin

# Testar login
npm run test-login
```

## 🔐 Segurança

- ✅ Use `NODE_ENV=production` em produção
- ✅ Altere o `JWT_SECRET` para um valor seguro
- ✅ Não commite o arquivo `.env` no repositório
- ✅ Configure CORS apenas para o domínio do frontend
- ✅ Use HTTPS em produção

