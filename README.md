# CRM - Gestão de Leads Pecuária

Sistema CRM para gestão comercial de leads de pecuária, desenvolvido com NestJS (backend) e React (frontend).

## 📋 Características

- **Dois perfis de usuário**: Admin e Agente
- **Gestão de Leads**: CRUD completo com filtros avançados
- **Regras de visibilidade**: Agentes veem apenas seus próprios leads
- **Autenticação JWT**: Sistema seguro de autenticação
- **Filtros**: Por nome, status, origem e vendedor (Admin)

## 🛠️ Stack Tecnológica

### Backend
- **NestJS** - Framework Node.js
- **TypeORM** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **bcrypt** - Hash de senhas

### Frontend
- **React** - Biblioteca JavaScript
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **React Router** - Roteamento
- **React Query** - Gerenciamento de estado e cache
- **Axios** - Cliente HTTP

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ 
- PostgreSQL 12+
- npm ou yarn

### Passo 1: Clone o repositório

```bash
git clone <url-do-repositorio>
cd CRM
```

### Passo 2: Instale as dependências

```bash
npm run install:all
```

### Passo 3: Configure o banco de dados

1. Crie um banco de dados PostgreSQL:

```sql
CREATE DATABASE crm_lead;
```

2. Execute a migration:

```bash
cd backend
psql -U postgres -d crm_lead -f src/migrations/001-create-tables.sql
```

Ou use o TypeORM para criar as tabelas automaticamente (em desenvolvimento):

```bash
cd backend
npm run migration:run
```

### Passo 4: Configure as variáveis de ambiente

**Backend** (`backend/.env`):

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=crm_leads

JWT_SECRET=seu_jwt_secret_super_seguro_aqui
JWT_EXPIRES_IN=24h

PORT=3001
NODE_ENV=development

FRONTEND_URL=http://localhost:3000
```

**Frontend**: Não requer configuração adicional (usa proxy do Vite)

### Passo 5: Execute o projeto

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

O backend estará disponível em `http://localhost:3001`
O frontend estará disponível em `http://localhost:3000`

## 👤 Usuário Padrão

Após executar a migration, você terá um usuário admin padrão:

- **Email**: `admin@crm.com`
- **Senha**: `admin123`

⚠️ **IMPORTANTE**: Altere a senha após o primeiro login!

## 📚 Estrutura do Projeto

```
CRM/
├── backend/
│   ├── src/
│   │   ├── auth/           # Módulo de autenticação
│   │   ├── users/           # Módulo de usuários
│   │   ├── leads/           # Módulo de leads
│   │   ├── config/          # Configurações (DB, etc)
│   │   └── migrations/      # Scripts SQL
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/          # Páginas
│   │   ├── contexts/       # Context API (Auth)
│   │   ├── services/       # API client
│   │   └── types/          # TypeScript types
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 🔐 Regras de Negócio

### Perfis de Usuário

**Admin:**
- Pode gerenciar usuários (CRUD)
- Vê todos os leads
- Pode criar leads para qualquer vendedor
- Pode filtrar por qualquer vendedor

**Agente:**
- Vê apenas seus próprios leads
- Pode criar leads apenas para si mesmo
- Não pode filtrar por outro vendedor
- Não pode transferir leads para outro vendedor

### Campos do Lead

- **data_entrada**: Data de entrada (obrigatório)
- **nome_razao_social**: Nome/Razão Social (obrigatório)
- **nome_fantasia_apelido**: Opcional
- **telefone**: Opcional
- **email**: Opcional
- **uf**: UF (2 caracteres, obrigatório)
- **municipio**: Município (obrigatório)
- **anotacoes**: Texto livre
- **origem_lead**: Single select
- **vendedor_id**: Referência ao usuário Agente (obrigatório)

## 🧪 Testes

### Backend

```bash
cd backend
npm test
```

### Frontend

```bash
cd frontend
npm test
```

## 📝 API Endpoints

### Autenticação
- `POST /auth/login` - Login

### Usuários (Admin apenas)
- `GET /users` - Lista todos os usuários
- `GET /users/agentes` - Lista agentes (público autenticado)
- `POST /users` - Cria usuário
- `PATCH /users/:id` - Atualiza usuário
- `DELETE /users/:id` - Desativa usuário

### Leads
- `GET /leads` - Lista leads (com filtros)
- `GET /leads/:id` - Busca lead por ID
- `POST /leads` - Cria lead
- `PATCH /leads/:id` - Atualiza lead
- `DELETE /leads/:id` - Remove lead

## 🚀 Deploy

### Publicação na KingHost

Para publicar a aplicação completa na KingHost, consulte o guia detalhado:

📖 **[GUIA_PUBLICACAO_KINGHOST.md](./GUIA_PUBLICACAO_KINGHOST.md)** - Guia completo passo a passo

O guia inclui:
- ✅ Preparação do backend e frontend
- ✅ Configuração de variáveis de ambiente
- ✅ Upload de arquivos
- ✅ Configuração do banco de dados
- ✅ Troubleshooting comum

### Scripts de Deploy

Scripts auxiliares estão disponíveis na pasta `scripts/`:

**Backend:**
```bash
# Linux/Mac
./scripts/deploy-backend.sh

# Windows
.\scripts\deploy-backend.ps1
```

**Frontend:**
```bash
# Linux/Mac
./scripts/deploy-frontend.sh https://seu-backend.kinghost.net

# Windows
.\scripts\deploy-frontend.ps1 https://seu-backend.kinghost.net
```

### Deploy Manual

#### Backend

1. Configure as variáveis de ambiente em produção
2. Execute as migrations
3. Build: `npm run build`
4. Execute: `npm run start:prod`

#### Frontend

1. Build: `npm run build`
2. Servir a pasta `dist` com um servidor web (nginx, Apache, etc)
3. Configure o servidor para servir `index.html` em todas as rotas (SPA)

## 📄 Licença

Este projeto é privado e de uso interno.

## 🤝 Contribuindo

1. Crie uma branch para sua feature
2. Faça commit das mudanças
3. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.




