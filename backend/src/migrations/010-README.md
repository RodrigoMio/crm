# Migration 010: Criação Completa de Todas as Tabelas

## 📋 Descrição

Esta migration cria todas as tabelas do sistema do zero, refletindo o estado atual após todas as alterações realizadas, incluindo:

- ✅ Remoção das colunas `status` e `itens_interesse` da tabela `leads`
- ✅ Campo `vendedor_id` como nullable (permite NULL para board "Novos")
- ✅ Campo `kanban_status_id` adicionado em `leads`
- ✅ Estrutura completa de Kanban (modelos, status, boards)
- ✅ Sistema de agendamentos (appointments)
- ✅ Sistema de ocorrências e produtos
- ✅ Suporte a colaboradores

## 🗂️ Tabelas Criadas

1. **usuarios** - Usuários do sistema (Admin, Agente, Colaborador)
2. **leads** - Leads do CRM
3. **kanban_modelo** - Modelos de Kanban
4. **kanban_status** - Status disponíveis no Kanban
5. **kanban_modelo_status** - Relacionamento modelo-status
6. **kanban_boards** - Boards de Kanban por usuário
7. **produto** - Produtos disponíveis
8. **ocorrencia** - Tipos de ocorrências
9. **lead_ocorrencia** - Ocorrências vinculadas a leads
10. **leads_produto** - Produtos vinculados a leads
11. **appointments** - Agendamentos de contato
12. **occurrences** - Ocorrências do sistema

## 🚀 Como Executar

### Opção 1: Via psql (linha de comando)

```bash
psql -U seu_usuario -d seu_banco -f backend/src/migrations/010-create-all-tables-complete.sql
```

### Opção 2: Via pgAdmin ou cliente PostgreSQL

1. Abra o arquivo `010-create-all-tables-complete.sql`
2. Execute todo o conteúdo no banco de dados

### Opção 3: Via painel de hospedagem (KingHost, etc)

1. Acesse o painel de gerenciamento do banco
2. Abra o editor SQL
3. Cole o conteúdo do arquivo
4. Execute

## ⚠️ ATENÇÃO

### Se você já tem dados no banco:

**Esta migration usa `CREATE TABLE IF NOT EXISTS`**, então:

- ✅ **Tabelas que não existem**: Serão criadas
- ⚠️ **Tabelas que já existem**: Serão ignoradas (não serão recriadas)
- ⚠️ **Colunas faltantes**: Não serão adicionadas automaticamente

### Se você precisa recriar tudo do zero:

1. **FAÇA BACKUP DOS DADOS ANTES!**
2. Execute:
   ```sql
   -- Remover todas as tabelas (CUIDADO: apaga todos os dados!)
   DROP TABLE IF EXISTS occurrences CASCADE;
   DROP TABLE IF EXISTS appointments CASCADE;
   DROP TABLE IF EXISTS leads_produto CASCADE;
   DROP TABLE IF EXISTS lead_ocorrencia CASCADE;
   DROP TABLE IF EXISTS ocorrencia CASCADE;
   DROP TABLE IF EXISTS produto CASCADE;
   DROP TABLE IF EXISTS kanban_boards CASCADE;
   DROP TABLE IF EXISTS kanban_modelo_status CASCADE;
   DROP TABLE IF EXISTS kanban_status CASCADE;
   DROP TABLE IF EXISTS kanban_modelo CASCADE;
   DROP TABLE IF EXISTS leads CASCADE;
   DROP TABLE IF EXISTS usuarios CASCADE;
   ```
3. Execute a migration `010-create-all-tables-complete.sql`

## 📝 Estrutura das Tabelas Principais

### usuarios
- `id` (SERIAL PRIMARY KEY)
- `nome`, `email`, `senha`
- `perfil` (ADMIN, AGENTE, COLABORADOR)
- `usuario_id_pai` (para colaboradores)

### leads
- `id` (SERIAL PRIMARY KEY)
- `data_entrada`, `nome_razao_social`, `nome_fantasia_apelido`
- `telefone`, `email`, `uf`, `municipio`, `anotacoes`
- `origem_lead` (enum)
- `vendedor_id` (NULLABLE - permite NULL)
- `usuario_id_colaborador` (NULLABLE)
- `kanban_status_id` (NULLABLE - referência a kanban_status)

### kanban_boards
- `id` (SERIAL PRIMARY KEY)
- `nome`, `cor_hex`, `ordem`, `tipo`
- Referências a usuarios, kanban_modelo, kanban_status

## ✅ Verificação Pós-Migration

Após executar, verifique se todas as tabelas foram criadas:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Deve retornar:
- appointments
- kanban_boards
- kanban_modelo
- kanban_modelo_status
- kanban_status
- lead_ocorrencia
- leads
- leads_produto
- ocorrencia
- occurrences
- produto
- usuarios

## 🔧 Próximos Passos

Após executar esta migration:

1. Verifique se todas as tabelas foram criadas
2. Verifique se os índices foram criados
3. Verifique se os triggers foram criados
4. Teste a aplicação para garantir que tudo está funcionando

## 📚 Migrations Anteriores

Esta migration consolida e substitui as seguintes migrations anteriores:
- 001-create-tables.sql
- 004-fix-leads-id-to-int.sql
- 006-create-kanban-boards.sql
- 007-create-appointments.sql
- 008-remove-status-column.sql
- 009-remove-itens-interesse-column.sql

**Nota:** Se você já executou essas migrations, não precisa executar esta. Esta é útil apenas para criar o banco do zero ou para referência.

