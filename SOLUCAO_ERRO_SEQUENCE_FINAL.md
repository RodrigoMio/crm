# 🔧 Solução Final: Erro CREATE SEQUENCE IF NOT EXISTS

## ❌ Problema

O PostgreSQL não suporta `IF NOT EXISTS` na sintaxe `CREATE SEQUENCE` em versões antigas. O TypeORM está tentando criar a sequência com essa sintaxe e falhando.

## ✅ Solução

### Passo 1: Criar Sequência Manualmente

Execute este script SQL no seu banco PostgreSQL (via painel Redehost):

```sql
-- Verificar se a sequência já existe e criar se necessário
DO $$ 
BEGIN
    -- Se a sequência não existir, criar
    IF NOT EXISTS (
        SELECT 1 FROM pg_sequences WHERE sequencename = 'leads_id_seq'
    ) THEN
        -- Criar a sequência (sem IF NOT EXISTS)
        CREATE SEQUENCE leads_id_seq OWNED BY leads.id;
        
        -- Definir o valor inicial baseado no maior ID existente
        PERFORM setval('leads_id_seq', COALESCE((SELECT MAX(id) FROM leads), 0) + 1, false);
        
        RAISE NOTICE 'Sequência leads_id_seq criada com sucesso.';
    ELSE
        RAISE NOTICE 'Sequência leads_id_seq já existe.';
    END IF;
END $$;

-- Verificar se a coluna id está usando a sequência corretamente
DO $$ 
BEGIN
    -- Se a coluna não estiver usando a sequência, atualizar
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'id' 
        AND column_default LIKE '%leads_id_seq%'
    ) THEN
        -- Atualizar a coluna para usar a sequência
        ALTER TABLE leads 
        ALTER COLUMN id SET DEFAULT nextval('leads_id_seq');
        
        RAISE NOTICE 'Coluna id configurada para usar a sequência leads_id_seq.';
    ELSE
        RAISE NOTICE 'Coluna id já está usando a sequência corretamente.';
    END IF;
END $$;
```

### Passo 2: Verificar Sequência

Após executar, verifique se a sequência foi criada:

```sql
-- Verificar se a sequência existe
SELECT sequencename, last_value 
FROM pg_sequences 
WHERE sequencename = 'leads_id_seq';

-- Verificar se a coluna está usando a sequência
SELECT column_name, column_default
FROM information_schema.columns 
WHERE table_name = 'leads' AND column_name = 'id';
```

Deve retornar:
- `sequencename`: `leads_id_seq`
- `column_default`: `nextval('leads_id_seq'::regclass)`

### Passo 3: Reiniciar o Backend

```bash
cd backend
npm run start:dev
```

O backend deve iniciar sem erros agora!

## 🔍 Explicação

O problema é que:
1. O TypeORM tenta criar a sequência com `CREATE SEQUENCE IF NOT EXISTS`
2. Versões antigas do PostgreSQL não suportam `IF NOT EXISTS` em `CREATE SEQUENCE`
3. A solução é criar a sequência manualmente usando `DO $$` para verificar se existe antes

## ✅ Status

- ✅ `synchronize` desabilitado (para evitar que TypeORM tente criar a sequência)
- ✅ Script SQL criado para criar a sequência manualmente
- ✅ Script verifica se a sequência já existe antes de criar

---

**Execute o script SQL e reinicie o backend!**






