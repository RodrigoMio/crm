# Deploy na KingHost - Guia de Instalação

Este guia explica como fazer o deploy do backend na KingHost.

## 📋 Pré-requisitos

1. Conta na KingHost com Node.js habilitado
2. Banco de dados PostgreSQL configurado na KingHost
3. Acesso SSH ou painel de controle da KingHost

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
# Database Configuration
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
PORT=3001
NODE_ENV=production

# Frontend URL (ajuste com a URL do seu frontend)
FRONTEND_URL=https://seu-dominio.com
```

**⚠️ IMPORTANTE:**
- Altere o `JWT_SECRET` para um valor seguro e único
- Ajuste o `FRONTEND_URL` para a URL do seu frontend em produção
- A porta será definida automaticamente pela KingHost (geralmente via variável `PORT`)

### 3. Upload dos Arquivos

Faça upload dos seguintes arquivos para o servidor da KingHost:

**Arquivos necessários:**
- `server.js` (arquivo de inicialização)
- `package.json`
- `dist/` (pasta com o código compilado - resultado do `npm run build`)
- `.env` (opcional, se a KingHost não usar variáveis de ambiente no painel)

**Estrutura de diretórios na KingHost:**
```
/
├── server.js
├── package.json
├── package-lock.json
├── .env (opcional)
└── dist/
    └── main.js
```

### 4. Instalar Dependências

Na KingHost, execute:

```bash
npm install --production
```

Isso instalará apenas as dependências de produção (sem devDependencies).

### 5. Executar Migrations

Antes de iniciar a aplicação, execute as migrations do banco de dados:

```bash
# Opção 1: Via SQL direto (recomendado)
# Execute o arquivo backend/src/migrations/001-create-tables.sql no banco de dados

# Opção 2: Via script (se TypeORM estiver configurado)
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

A KingHost geralmente define a porta via variável de ambiente `PORT`. O código já está preparado para usar essa variável.

### Uploads

A pasta `uploads/` será criada automaticamente. Certifique-se de que o servidor tem permissão de escrita nessa pasta.

## 🐛 Troubleshooting

### Erro: "Arquivo dist/main.js não encontrado"
**Solução:** Execute `npm run build` antes de fazer o deploy.

### Erro de conexão com banco de dados
**Solução:** Verifique se as variáveis de ambiente do banco estão corretas e se o banco está acessível.

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

