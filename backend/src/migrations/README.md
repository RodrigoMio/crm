# Migrations

Este diretório contém scripts SQL para criação e atualização do banco de dados.

## Como executar

### Opção 1: Via psql (recomendado)

```bash
psql -U postgres -d crm_lead -f src/migrations/001-create-tables.sql
```

### Opção 2: Via TypeORM

```bash
npm run migration:run
```

## Estrutura

### Migrations Principais

- `010-create-all-tables-complete.sql`: **Migration completa** - Cria todas as tabelas do sistema do zero (recomendado para novos bancos)
- `001-create-tables.sql`: Criação inicial das tabelas `usuarios` e `leads` (legado)
- `002-alter-telefone-size.sql`: Altera o tamanho do campo `telefone` de VARCHAR(20) para VARCHAR(255)
- `003-add-colaboradores-*.sql`: Adiciona suporte a colaboradores
- `004-fix-leads-id-to-int.sql`: Converte ID de leads de VARCHAR para INT
- `006-create-kanban-boards.sql`: Cria estrutura de Kanban
- `007-create-appointments.sql`: Cria tabela de agendamentos
- `008-remove-status-column.sql`: Remove coluna `status` de leads
- `009-remove-itens-interesse-column.sql`: Remove coluna `itens_interesse` de leads

### Para Novo Banco de Dados

**Use a migration `010-create-all-tables-complete.sql`** - Ela cria todas as tabelas com a estrutura atualizada de uma vez.

## Usuário Padrão

Após executar a migration, você terá um usuário admin:

- **Email**: admin@crm.com
- **Senha**: admin123

⚠️ **IMPORTANTE**: Altere a senha após o primeiro login!




