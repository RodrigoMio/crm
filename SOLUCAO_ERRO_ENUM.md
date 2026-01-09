# 🔧 Solução para Erro de Sintaxe no ALTER TYPE

## ❌ Erro Encontrado

```
SQL Error [42601]: ERROR: syntax error at or near "ADD"
Position: 33
```

## 🔍 Causa

O comando `ALTER TYPE ... ADD VALUE` **não pode ser executado diretamente** em algumas versões do PostgreSQL ou quando está dentro de uma transação explícita.

## ✅ Solução

Execute o comando dentro de um bloco `DO $$`:

### Comando Correto:

```sql
DO $$ 
BEGIN
    -- Verifica se o enum existe
    IF EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'usuarios_perfil_enum'
    ) THEN
        -- Verifica se 'COLABORADOR' já existe
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'COLABORADOR' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'usuarios_perfil_enum')
        ) THEN
            -- Adiciona o valor ao enum
            ALTER TYPE usuarios_perfil_enum ADD VALUE 'COLABORADOR';
        END IF;
    END IF;
END $$;
```

## 📋 Script Completo

Use o arquivo `003-add-colaboradores-FINAL.sql` que contém todos os comandos corrigidos.

### Ou execute passo a passo:

**1. Adicionar COLABORADOR ao enum:**
```sql
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'usuarios_perfil_enum') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'COLABORADOR' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'usuarios_perfil_enum')
        ) THEN
            ALTER TYPE usuarios_perfil_enum ADD VALUE 'COLABORADOR';
        END IF;
    END IF;
END $$;
```

**2. Adicionar campo usuario_id_pai:**
```sql
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS usuario_id_pai INTEGER NULL;
```

**3. Adicionar foreign key:**
```sql
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_usuarios_usuario_id_pai'
    ) THEN
        ALTER TABLE usuarios 
        ADD CONSTRAINT fk_usuarios_usuario_id_pai 
        FOREIGN KEY (usuario_id_pai) 
        REFERENCES usuarios(id) 
        ON DELETE RESTRICT;
    END IF;
END $$;
```

**4. Criar índice:**
```sql
CREATE INDEX IF NOT EXISTS idx_usuarios_usuario_id_pai 
ON usuarios(usuario_id_pai);
```

**5. Adicionar campo usuario_id_colaborador em leads:**
```sql
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS usuario_id_colaborador INTEGER NULL;
```

**6. Adicionar foreign key em leads:**
```sql
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_leads_usuario_id_colaborador'
    ) THEN
        ALTER TABLE leads 
        ADD CONSTRAINT fk_leads_usuario_id_colaborador 
        FOREIGN KEY (usuario_id_colaborador) 
        REFERENCES usuarios(id) 
        ON DELETE SET NULL;
    END IF;
END $$;
```

**7. Criar índice em leads:**
```sql
CREATE INDEX IF NOT EXISTS idx_leads_usuario_id_colaborador 
ON leads(usuario_id_colaborador);
```

## 🎯 Por que usar DO $$?

O bloco `DO $$` permite:
- ✅ Executar comandos que não podem estar em transações
- ✅ Usar lógica condicional (IF/THEN)
- ✅ Verificar se algo já existe antes de criar
- ✅ Evitar erros se executar múltiplas vezes

## ⚠️ Importante

- Execute o bloco `DO $$` completo de uma vez
- Não execute apenas a linha `ALTER TYPE ... ADD VALUE` isoladamente
- O bloco `DO $$` é uma unidade de execução

## ✅ Verificação

Após executar, verifique:

```sql
-- Verificar se COLABORADOR foi adicionado
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'usuarios_perfil_enum')
ORDER BY enumsortorder;

-- Deve mostrar: ADMIN, AGENTE, COLABORADOR
```






