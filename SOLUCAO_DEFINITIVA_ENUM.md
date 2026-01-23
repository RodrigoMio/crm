# 🎯 Solução Definitiva - Adicionar COLABORADOR ao ENUM

## ⚠️ Limitação do PostgreSQL

O comando `ALTER TYPE ... ADD VALUE` **NÃO PODE** ser executado:
- ❌ Dentro de funções PL/pgSQL
- ❌ Dentro de blocos `DO $$`
- ❌ Dentro de transações explícitas
- ❌ Com `EXECUTE` dentro de funções

**Deve ser executado DIRETAMENTE**, como um comando SQL simples.

## ✅ Solução: Executar Diretamente

### Passo 1: Adicionar COLABORADOR ao enum

Execute este comando **sozinho**, diretamente no editor SQL:

```sql
ALTER TYPE usuarios_perfil_enum ADD VALUE 'COLABORADOR';
```

**⚠️ Se der erro dizendo que já existe:**
- Erro: `enum label "COLABORADOR" already exists`
- **Isso é BOM!** Significa que já foi adicionado
- Continue para o Passo 2

### Passo 2: Adicionar campo usuario_id_pai

```sql
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS usuario_id_pai INTEGER NULL;
```

### Passo 3: Adicionar foreign key

```sql
ALTER TABLE usuarios 
ADD CONSTRAINT fk_usuarios_usuario_id_pai 
FOREIGN KEY (usuario_id_pai) 
REFERENCES usuarios(id) 
ON DELETE RESTRICT;
```

**⚠️ Se der erro "constraint already exists":**
- Ignore e continue

### Passo 4: Criar índice

```sql
CREATE INDEX IF NOT EXISTS idx_usuarios_usuario_id_pai 
ON usuarios(usuario_id_pai);
```

### Passo 5: Adicionar campo usuario_id_colaborador

```sql
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS usuario_id_colaborador INTEGER NULL;
```

### Passo 6: Adicionar foreign key em leads

```sql
ALTER TABLE leads 
ADD CONSTRAINT fk_leads_usuario_id_colaborador 
FOREIGN KEY (usuario_id_colaborador) 
REFERENCES usuarios(id) 
ON DELETE SET NULL;
```

**⚠️ Se der erro "constraint already exists":**
- Ignore e continue

### Passo 7: Criar índice em leads

```sql
CREATE INDEX IF NOT EXISTS idx_leads_usuario_id_colaborador 
ON leads(usuario_id_colaborador);
```

## 🔍 Verificação

Após executar todos os passos, verifique:

```sql
-- Verificar se COLABORADOR foi adicionado
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'usuarios_perfil_enum')
ORDER BY enumsortorder;

-- Deve mostrar: ADMIN, AGENTE, COLABORADOR

-- Verificar campos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'usuarios' AND column_name = 'usuario_id_pai';

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'leads' AND column_name = 'usuario_id_colaborador';
```

## 🚨 Se o Passo 1 ainda não funcionar

Se mesmo executando diretamente der erro, pode ser:

1. **Versão muito antiga do PostgreSQL** (antes da 8.3)
   - Solução: Atualizar PostgreSQL ou usar outra abordagem

2. **Cliente SQL com limitações**
   - Solução: Tentar via linha de comando (psql)

### Tentar via linha de comando (SSH)

Se tiver acesso SSH ao servidor:

```bash
psql -U user_cc_crm -d db_cc_crm -h pgsql01.redehost.com.br -c "ALTER TYPE usuarios_perfil_enum ADD VALUE 'COLABORADOR';"
```

## 📋 Script Completo (para copiar e colar)

Execute cada comando **separadamente**, um de cada vez:

```sql
-- 1. Adicionar COLABORADOR ao enum
ALTER TYPE usuarios_perfil_enum ADD VALUE 'COLABORADOR';

-- 2. Adicionar campo usuario_id_pai
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS usuario_id_pai INTEGER NULL;

-- 3. Adicionar foreign key
ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_usuario_id_pai 
FOREIGN KEY (usuario_id_pai) REFERENCES usuarios(id) ON DELETE RESTRICT;

-- 4. Criar índice
CREATE INDEX IF NOT EXISTS idx_usuarios_usuario_id_pai ON usuarios(usuario_id_pai);

-- 5. Adicionar campo usuario_id_colaborador
ALTER TABLE leads ADD COLUMN IF NOT EXISTS usuario_id_colaborador INTEGER NULL;

-- 6. Adicionar foreign key em leads
ALTER TABLE leads ADD CONSTRAINT fk_leads_usuario_id_colaborador 
FOREIGN KEY (usuario_id_colaborador) REFERENCES usuarios(id) ON DELETE SET NULL;

-- 7. Criar índice em leads
CREATE INDEX IF NOT EXISTS idx_leads_usuario_id_colaborador ON leads(usuario_id_colaborador);
```

## ✅ Resumo

- ✅ Execute `ALTER TYPE ... ADD VALUE` **diretamente**, sem função
- ✅ Se der erro "already exists", ignore e continue
- ✅ Execute cada comando separadamente
- ✅ Use `IF NOT EXISTS` onde possível para evitar erros









