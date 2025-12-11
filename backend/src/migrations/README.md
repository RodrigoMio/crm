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

- `001-create-tables.sql`: Criação inicial das tabelas `usuarios` e `leads`
- `002-alter-telefone-size.sql`: Altera o tamanho do campo `telefone` de VARCHAR(20) para VARCHAR(255)

## Usuário Padrão

Após executar a migration, você terá um usuário admin:

- **Email**: admin@crm.com
- **Senha**: admin123

⚠️ **IMPORTANTE**: Altere a senha após o primeiro login!




