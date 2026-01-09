# 🔧 Solução para Erro "syntax error at or near 'DO'"

## ❌ Erro

```
SQL Error [42601]: ERROR: syntax error at or near "DO"
Position: 1
```

## 🔍 Possíveis Causas

1. **Versão antiga do PostgreSQL** (antes da 9.0)
2. **Cliente SQL não suporta blocos DO**
3. **Configuração do cliente bloqueando blocos anônimos**

## ✅ Soluções Alternativas

### Solução 1: Executar diretamente (mais simples)

Tente executar diretamente (algumas versões do PostgreSQL suportam):

```sql
ALTER TYPE usuarios_perfil_enum ADD VALUE 'COLABORADOR';
```

**⚠️ Atenção:** Se 'COLABORADOR' já existir, dará erro. Mas você pode ignorar o erro e continuar.

---

### Solução 2: Usar função temporária

Se a Solução 1 não funcionar, use uma função:

**Passo 1: Criar a função**
```sql
CREATE OR REPLACE FUNCTION add_colaborador_to_enum()
RETURNS void AS $$
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
END;
$$ LANGUAGE plpgsql;
```

**Passo 2: Executar a função**
```sql
SELECT add_colaborador_to_enum();
```

**Passo 3: Remover a função (opcional)**
```sql
DROP FUNCTION IF EXISTS add_colaborador_to_enum();
```

---

### Solução 3: Verificar versão do PostgreSQL

Primeiro, verifique a versão:

```sql
SELECT version();
```

- **PostgreSQL 9.0+**: Suporta `DO $$`
- **PostgreSQL 8.x ou anterior**: Não suporta `DO $$`, use Solução 2

---

### Solução 4: Executar via psql (linha de comando)

Se tiver acesso SSH, tente via linha de comando:

```bash
psql -U seu_usuario -d seu_banco -h pgsql01.redehost.com.br -c "ALTER TYPE usuarios_perfil_enum ADD VALUE 'COLABORADOR';"
```

---

## 🎯 Recomendação

**Tente nesta ordem:**

1. ✅ **Primeiro:** Execute diretamente:
   ```sql
   ALTER TYPE usuarios_perfil_enum ADD VALUE 'COLABORADOR';
   ```

2. ✅ **Se der erro:** Use a função (Solução 2)

3. ✅ **Se ainda não funcionar:** Verifique a versão do PostgreSQL

---

## 📋 Script Completo (após adicionar COLABORADOR)

Depois de adicionar 'COLABORADOR' ao enum (usando qualquer método acima), execute o resto:

```sql
-- Adicionar campo usuario_id_pai
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS usuario_id_pai INTEGER NULL;

-- Adicionar foreign key (pode precisar de função também)
CREATE OR REPLACE FUNCTION add_fk_usuario_id_pai()
RETURNS void AS $$
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
END;
$$ LANGUAGE plpgsql;

SELECT add_fk_usuario_id_pai();
DROP FUNCTION IF EXISTS add_fk_usuario_id_pai();

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_usuarios_usuario_id_pai 
ON usuarios(usuario_id_pai);

-- Adicionar campo usuario_id_colaborador em leads
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS usuario_id_colaborador INTEGER NULL;

-- Adicionar foreign key em leads
CREATE OR REPLACE FUNCTION add_fk_leads_colaborador()
RETURNS void AS $$
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
END;
$$ LANGUAGE plpgsql;

SELECT add_fk_leads_colaborador();
DROP FUNCTION IF EXISTS add_fk_leads_colaborador();

-- Criar índice em leads
CREATE INDEX IF NOT EXISTS idx_leads_usuario_id_colaborador 
ON leads(usuario_id_colaborador);
```

---

## ✅ Verificação

Após executar, verifique:

```sql
-- Verificar se COLABORADOR foi adicionado
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'usuarios_perfil_enum')
ORDER BY enumsortorder;
```

Deve mostrar: **ADMIN, AGENTE, COLABORADOR**






