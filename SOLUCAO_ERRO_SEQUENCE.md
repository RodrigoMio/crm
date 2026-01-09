# 🔧 Solução: Erro CREATE SEQUENCE IF NOT EXISTS

## ❌ Problema

O backend está falhando ao iniciar com o erro:
```
syntax error at or near "NOT"
CREATE SEQUENCE IF NOT EXISTS "leads_id_seq" OWNED BY "leads"."id"
```

## 🔍 Causa

O TypeORM está tentando criar uma sequência para a coluna `id` da tabela `leads`, mas:
1. A tabela no banco ainda tem `id` como VARCHAR/UUID
2. A entidade está definida como `@PrimaryGeneratedColumn()` (INT)
3. O TypeORM não consegue criar a sequência porque a coluna não é INTEGER

## ✅ Solução

### Passo 1: Desabilitar Synchronize

O `synchronize` já foi desabilitado no `database.config.ts` para evitar que o TypeORM tente alterar o schema automaticamente.

### Passo 2: Executar Migração SQL Manual

Execute o script SQL abaixo no seu banco PostgreSQL (via painel Redehost ou psql):

```sql
-- Verificar tipo atual da coluna id
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' AND column_name = 'id';

-- Se for VARCHAR ou UUID, execute o script abaixo
-- ⚠️ ATENÇÃO: Este script APAGA todos os dados da tabela leads!
-- Faça backup antes se necessário!

-- 1. Remover foreign keys dependentes
ALTER TABLE IF EXISTS occurrences DROP CONSTRAINT IF EXISTS occurrences_leads_id_fkey;

-- 2. Remover a tabela leads
DROP TABLE IF EXISTS leads CASCADE;

-- 3. Recriar a tabela com id INTEGER
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    data_entrada DATE NOT NULL,
    nome_razao_social VARCHAR(255) NOT NULL,
    nome_fantasia_apelido VARCHAR(255),
    telefone VARCHAR(255),
    email VARCHAR(255),
    uf VARCHAR(2),
    municipio VARCHAR(255),
    anotacoes TEXT,
    status TEXT[],
    itens_interesse TEXT[],
    origem_lead VARCHAR(50) CHECK (origem_lead IN (
        'CAMPANHA_MKT',
        'HABILITADOS',
        'BASE_RD',
        'NETWORKING',
        'WHATSAPP',
        'AGENTE_VENDAS',
        'BASE_CANAL_DO_CAMPO'
    )),
    vendedor_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    usuario_id_colaborador INTEGER NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Recriar índices
CREATE INDEX IF NOT EXISTS idx_leads_vendedor_id ON leads(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_leads_data_entrada ON leads(data_entrada);
CREATE INDEX IF NOT EXISTS idx_leads_nome_razao_social ON leads(nome_razao_social);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads USING GIN(status);
CREATE INDEX IF NOT EXISTS idx_leads_origem_lead ON leads(origem_lead);
CREATE INDEX IF NOT EXISTS idx_leads_usuario_id_colaborador ON leads(usuario_id_colaborador);

-- 5. Recriar foreign key para occurrences (se existir)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'occurrences') THEN
        ALTER TABLE occurrences 
        ADD CONSTRAINT occurrences_leads_id_fkey 
        FOREIGN KEY (leads_id) 
        REFERENCES leads(id) 
        ON DELETE CASCADE;
    END IF;
END $$;
```

### Passo 3: Reiniciar o Backend

Após executar o script SQL:

```bash
cd backend
npm run start:dev
```

## 📋 Verificação

Após executar, verifique se a coluna está correta:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'leads' AND column_name = 'id';
```

Deve retornar:
- `data_type`: `integer`
- `column_default`: `nextval('leads_id_seq'::regclass)`

## ⚠️ Importante

- **Este script APAGA todos os dados da tabela `leads`**
- Se você tem dados importantes, faça backup antes!
- O script também remove a tabela `occurrences` se existir (por causa do CASCADE)
- Se precisar preservar dados, será necessário uma migração mais complexa

## 🔄 Alternativa (Preservar Dados)

Se você precisa preservar os dados existentes, será necessário:
1. Exportar os dados para CSV/JSON
2. Executar o script acima
3. Importar os dados novamente (ajustando os IDs)

---

**Status: ✅ Synchronize desabilitado + Script SQL criado**






