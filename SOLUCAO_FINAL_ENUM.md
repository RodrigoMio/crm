# ✅ Solução Final - Adicionar COLABORADOR ao ENUM

## ❌ Problema

O comando `ALTER TYPE ... ADD VALUE` **não pode ser executado diretamente** dentro de uma função PL/pgSQL. Precisa usar `EXECUTE` para DDL dinâmico.

## ✅ Solução Corrigida

Use esta função que usa `EXECUTE`:

```sql
CREATE OR REPLACE FUNCTION add_colaborador_to_enum()
RETURNS void AS $$
BEGIN
    -- Verifica se o enum existe
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'usuarios_perfil_enum') THEN
        -- Verifica se 'COLABORADOR' já existe
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'COLABORADOR' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'usuarios_perfil_enum')
        ) THEN
            -- Usa EXECUTE para executar DDL dinamicamente
            EXECUTE 'ALTER TYPE usuarios_perfil_enum ADD VALUE ''COLABORADOR''';
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Executar a função
SELECT add_colaborador_to_enum();

-- Remover a função após uso (opcional)
DROP FUNCTION IF EXISTS add_colaborador_to_enum();
```

## 🔑 Diferença Importante

**❌ ERRADO (não funciona dentro de função):**
```sql
ALTER TYPE usuarios_perfil_enum ADD VALUE 'COLABORADOR';
```

**✅ CORRETO (usa EXECUTE):**
```sql
EXECUTE 'ALTER TYPE usuarios_perfil_enum ADD VALUE ''COLABORADOR''';
```

Note que dentro da string do `EXECUTE`, as aspas simples são duplicadas (`''`) para escapar.

## 📋 Passos Completos

### 1. Adicionar COLABORADOR ao enum

Execute a função acima.

### 2. Adicionar campo usuario_id_pai

```sql
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS usuario_id_pai INTEGER NULL;
```

### 3. Adicionar foreign key usuario_id_pai

```sql
CREATE OR REPLACE FUNCTION add_fk_usuario_id_pai()
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_usuarios_usuario_id_pai'
    ) THEN
        EXECUTE 'ALTER TABLE usuarios 
                 ADD CONSTRAINT fk_usuarios_usuario_id_pai 
                 FOREIGN KEY (usuario_id_pai) 
                 REFERENCES usuarios(id) 
                 ON DELETE RESTRICT';
    END IF;
END;
$$ LANGUAGE plpgsql;

SELECT add_fk_usuario_id_pai();
DROP FUNCTION IF EXISTS add_fk_usuario_id_pai();
```

### 4. Criar índice usuario_id_pai

```sql
CREATE INDEX IF NOT EXISTS idx_usuarios_usuario_id_pai 
ON usuarios(usuario_id_pai);
```

### 5. Adicionar campo usuario_id_colaborador em leads

```sql
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS usuario_id_colaborador INTEGER NULL;
```

### 6. Adicionar foreign key usuario_id_colaborador

```sql
CREATE OR REPLACE FUNCTION add_fk_leads_colaborador()
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_leads_usuario_id_colaborador'
    ) THEN
        EXECUTE 'ALTER TABLE leads 
                 ADD CONSTRAINT fk_leads_usuario_id_colaborador 
                 FOREIGN KEY (usuario_id_colaborador) 
                 REFERENCES usuarios(id) 
                 ON DELETE SET NULL';
    END IF;
END;
$$ LANGUAGE plpgsql;

SELECT add_fk_leads_colaborador();
DROP FUNCTION IF EXISTS add_fk_leads_colaborador();
```

### 7. Criar índice usuario_id_colaborador

```sql
CREATE INDEX IF NOT EXISTS idx_leads_usuario_id_colaborador 
ON leads(usuario_id_colaborador);
```

## ✅ Verificação

Após executar tudo, verifique:

```sql
-- Verificar se COLABORADOR foi adicionado
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'usuarios_perfil_enum')
ORDER BY enumsortorder;

-- Deve mostrar: ADMIN, AGENTE, COLABORADOR

-- Verificar campos adicionados
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'usuarios' AND column_name = 'usuario_id_pai';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' AND column_name = 'usuario_id_colaborador';
```

## 🎯 Resumo

- ✅ Use `EXECUTE` para DDL dentro de funções PL/pgSQL
- ✅ Duplique aspas simples dentro da string do EXECUTE (`''`)
- ✅ A função verifica se já existe antes de adicionar
- ✅ Pode executar múltiplas vezes sem erro









