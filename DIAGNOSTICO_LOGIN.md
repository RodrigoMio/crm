# Diagnóstico de Problema de Login

## Problema
Erro ao fazer login com `admin@crm.com` / `admin123`

## Possíveis Causas

### 1. Backend não está rodando
**Solução:** Certifique-se de que o backend está rodando na porta 3001
```bash
cd backend
npm run start:dev
```

### 2. Usuário admin não existe no banco ou hash incorreto
**Solução:** Execute o script para criar/atualizar o usuário admin
```bash
cd backend
npm run create-admin
```

### 3. Banco de dados não está acessível
**Solução:** Verifique se o PostgreSQL está rodando e se as credenciais estão corretas

Crie um arquivo `.env` no diretório `backend/` com:
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

### 4. Tabelas não foram criadas
**Solução:** Execute a migration SQL ou use o TypeORM synchronize
```bash
# Opção 1: Via SQL
psql -U postgres -d crm_leads -f backend/src/migrations/001-create-tables.sql

# Opção 2: O TypeORM vai criar automaticamente se synchronize=true (desenvolvimento)
```

## Verificações

### Verificar se backend está respondendo
```bash
curl http://localhost:3001/auth/login -X POST -H "Content-Type: application/json" -d "{\"email\":\"admin@crm.com\",\"senha\":\"admin123\"}"
```

### Verificar se usuário existe no banco
```sql
SELECT id, nome, email, perfil, ativo FROM usuarios WHERE email = 'admin@crm.com';
```

### Verificar logs do backend
Quando tentar fazer login, verifique o console do backend para ver se há erros.

## Correções Aplicadas

1. ✅ Corrigido problema do esbuild (arquitetura incorreta)
2. ✅ Corrigido LocalStrategy (removido check redundante)
3. ✅ Criado script `create-admin` para garantir usuário admin existe

## Próximos Passos

1. Certifique-se de que o PostgreSQL está rodando
2. Execute `npm run create-admin` no diretório backend
3. Inicie o backend: `cd backend && npm run start:dev`
4. Inicie o frontend: `cd frontend && npm run dev`
5. Tente fazer login novamente












