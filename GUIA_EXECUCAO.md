# 🚀 Guia de Execução - CRM de Leads

Este guia fornece instruções passo a passo para executar o projeto.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

1. **Node.js** (versão 18 ou superior)
   - Verificar: `node --version`
   - Download: https://nodejs.org/

2. **PostgreSQL** (versão 12 ou superior)
   - Verificar: `psql --version`
   - Download: https://www.postgresql.org/download/

3. **npm** (vem com Node.js)
   - Verificar: `npm --version`

## 🔧 Passo 1: Instalar Dependências

Abra o terminal na raiz do projeto e execute:

```bash
npm run install:all
```

Este comando instalará as dependências do backend e frontend automaticamente.

**Ou manualmente:**

```bash
# Instalar dependências do backend
cd backend
npm install

# Instalar dependências do frontend
cd ../frontend
npm install

# Voltar para a raiz
cd ..
```

## 🗄️ Passo 2: Configurar Banco de Dados

### 2.1. Criar o banco de dados

Abra o PostgreSQL (pgAdmin ou linha de comando) e execute:

```sql
CREATE DATABASE crm_leads;
```

**Ou via linha de comando:**
```bash
psql -U postgres -c "CREATE DATABASE crm_leads;"
```

### 2.2. Executar a migration

**Opção A - Via SQL (Recomendado):**
```bash
cd backend
psql -U postgres -d crm_leads -f src/migrations/001-create-tables.sql
```

**Opção B - Via TypeORM (se configurado):**
```bash
cd backend
npm run migration:run
```

**Opção C - Automático (desenvolvimento):**
O TypeORM criará as tabelas automaticamente se `synchronize: true` estiver ativo (apenas em desenvolvimento).

## ⚙️ Passo 3: Configurar Variáveis de Ambiente

### 3.1. Criar arquivo .env no backend

Crie o arquivo `backend/.env` com o seguinte conteúdo:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=sua_senha_postgres
DB_DATABASE=crm_leads

# JWT
JWT_SECRET=seu_jwt_secret_super_seguro_aqui_mude_em_producao
JWT_EXPIRES_IN=24h

# Server
PORT=3001
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:3000
```

**⚠️ IMPORTANTE:**
- Substitua `sua_senha_postgres` pela senha do seu PostgreSQL
- Altere `JWT_SECRET` para um valor seguro em produção

## 🎯 Passo 4: Executar o Projeto

### 4.1. Iniciar o Backend

Abra um terminal e execute:

```bash
cd backend
npm run start:dev
```

Você deve ver:
```
🚀 Backend rodando na porta 3001
```

### 4.2. Iniciar o Frontend

Abra **outro terminal** e execute:

```bash
cd frontend
npm run dev
```

Você deve ver:
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
```

## 🌐 Passo 5: Acessar a Aplicação

1. Abra seu navegador em: **http://localhost:3000**

2. Faça login com as credenciais padrão:
   - **Email**: `admin@crm.com`
   - **Senha**: `admin123`

## 📊 Passo 6: Popular com Dados de Exemplo (Opcional)

Para adicionar dados de exemplo (usuários e leads), execute o script de seed:

```bash
cd backend
npx ts-node src/scripts/seed.ts
```

Isso criará:
- 1 usuário Admin (admin@crm.com)
- 2 usuários Agente (joao@crm.com e maria@crm.com)
- 3 leads de exemplo

**Credenciais após seed:**
- Admin: `admin@crm.com` / `admin123`
- Agente 1: `joao@crm.com` / `agente123`
- Agente 2: `maria@crm.com` / `agente123`

## 🔍 Verificação

### Backend está funcionando?
Acesse: http://localhost:3001 (deve retornar erro 404, mas significa que está rodando)

### Frontend está funcionando?
Acesse: http://localhost:3000 (deve abrir a tela de login)

### Banco de dados está conectado?
Verifique os logs do backend. Se houver erro de conexão, verifique:
- PostgreSQL está rodando?
- Credenciais no `.env` estão corretas?
- Banco `crm_leads` foi criado?

## ❌ Problemas Comuns

### Erro: "Cannot find module"
```bash
# Reinstale as dependências
cd backend && npm install
cd ../frontend && npm install
```

### Erro: "Connection refused" (PostgreSQL)
- Verifique se o PostgreSQL está rodando
- Verifique as credenciais no arquivo `.env`
- Verifique se a porta 5432 está correta

### Erro: "Port 3001 already in use"
- Altere a porta no arquivo `.env`: `PORT=3002`
- Ou encerre o processo que está usando a porta 3001

### Erro: "Port 3000 already in use"
- O Vite tentará usar outra porta automaticamente
- Ou altere no `vite.config.ts`

### Erro de autenticação no login
- Verifique se o usuário admin foi criado (execute a migration)
- Verifique se o hash da senha está correto no SQL

## 📝 Comandos Úteis

```bash
# Instalar todas as dependências
npm run install:all

# Rodar backend em modo desenvolvimento
cd backend && npm run start:dev

# Rodar frontend em modo desenvolvimento
cd frontend && npm run dev

# Build do backend (produção)
cd backend && npm run build && npm run start:prod

# Build do frontend (produção)
cd frontend && npm run build
```

## 🎉 Pronto!

Se tudo estiver funcionando, você deve conseguir:
- ✅ Fazer login
- ✅ Ver a listagem de leads
- ✅ Criar/editar leads
- ✅ Filtrar leads
- ✅ (Admin) Gerenciar usuários





