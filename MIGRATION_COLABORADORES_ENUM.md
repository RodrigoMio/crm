# 🔧 Migration Corrigida - Colaboradores (ENUM)

## ⚠️ Problema Identificado

A tabela `usuarios` usa um tipo **ENUM** (`usuarios_perfil_enum`) ao invés de VARCHAR com CHECK constraint. Por isso, precisamos adicionar o valor 'COLABORADOR' ao enum antes de usar.

## ✅ Solução

Use a migration corrigida abaixo que:
1. Adiciona 'COLABORADOR' ao enum `usuarios_perfil_enum`
2. Adiciona os campos `usuario_id_pai` e `usuario_id_colaborador`
3. Cria as foreign keys e índices necessários

---

## 📝 Script SQL Corrigido

Execute este script no PostgreSQL:

```sql
-- Migration: Adicionar suporte a Colaboradores (CORRIGIDA)
-- Execute este script no PostgreSQL para adicionar os campos necessários
-- Esta versão corrige o problema com ENUM ao invés de VARCHAR

-- 1. Adicionar perfil COLABORADOR ao enum usuarios_perfil_enum
-- Primeiro, verifica se o enum existe e adiciona o valor 'COLABORADOR'
DO $$ 
BEGIN
    -- Adiciona 'COLABORADOR' ao enum se ainda não existir
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'COLABORADOR' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'usuarios_perfil_enum')
    ) THEN
        ALTER TYPE usuarios_perfil_enum ADD VALUE 'COLABORADOR';
    END IF;
END $$;

-- 2. Adicionar campo usuario_id_pai na tabela usuarios
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS usuario_id_pai INTEGER NULL;

-- 3. Adicionar foreign key para usuario_id_pai
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

-- 4. Adicionar índice para melhor performance (usuarios)
CREATE INDEX IF NOT EXISTS idx_usuarios_usuario_id_pai ON usuarios(usuario_id_pai);

-- 5. Adicionar campo usuario_id_colaborador na tabela leads
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS usuario_id_colaborador INTEGER NULL;

-- 6. Adicionar foreign key para usuario_id_colaborador
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

-- 7. Adicionar índice para melhor performance (leads)
CREATE INDEX IF NOT EXISTS idx_leads_usuario_id_colaborador ON leads(usuario_id_colaborador);

-- 8. Comentários para documentação
COMMENT ON COLUMN usuarios.usuario_id_pai IS 'Referência ao usuário Agente pai (apenas para COLABORADOR)';
COMMENT ON COLUMN leads.usuario_id_colaborador IS 'Referência ao usuário Colaborador responsável pelo lead';
```

---

## 🚀 Como Executar

### Via Painel PostgreSQL (Redehost)

1. Acesse o painel do PostgreSQL na Redehost
2. Selecione o banco de dados `db_cc_crm`
3. Abra a ferramenta de SQL/Query
4. Cole o script acima completo
5. Execute

### Via Linha de Comando

```bash
psql -U user_cc_crm -d db_cc_crm -h pgsql01.redehost.com.br -f migration.sql
```

---

## ✅ Verificação

Após executar, verifique:

```sql
-- Verificar se COLABORADOR foi adicionado ao enum
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'usuarios_perfil_enum')
ORDER BY enumsortorder;

-- Deve mostrar: ADMIN, AGENTE, COLABORADOR

-- Verificar se o campo foi adicionado em usuarios
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'usuarios' AND column_name = 'usuario_id_pai';

-- Verificar se o campo foi adicionado em leads
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'leads' AND column_name = 'usuario_id_colaborador';
```

---

## 📋 O que a Migration Faz

1. ✅ Adiciona 'COLABORADOR' ao enum `usuarios_perfil_enum`
2. ✅ Adiciona campo `usuario_id_pai` (INTEGER NULL) em `usuarios`
3. ✅ Adiciona foreign key `fk_usuarios_usuario_id_pai`
4. ✅ Adiciona índice `idx_usuarios_usuario_id_pai`
5. ✅ Adiciona campo `usuario_id_colaborador` (INTEGER NULL) em `leads`
6. ✅ Adiciona foreign key `fk_leads_usuario_id_colaborador`
7. ✅ Adiciona índice `idx_leads_usuario_id_colaborador`

---

## ⚠️ Importante

- A migration usa `IF NOT EXISTS` e verificações, então pode ser executada várias vezes sem erro
- Os campos são `NULL` por padrão, então não afeta dados existentes
- **Não é possível remover valores de ENUM** no PostgreSQL, então 'COLABORADOR' ficará permanentemente no enum

---

## 🐛 Troubleshooting

### Erro: "enum label 'COLABORADOR' already exists"
- Significa que o valor já foi adicionado ao enum
- Pode continuar com o resto da migration

### Erro: "constraint already exists"
- Significa que a constraint já foi criada
- Pode continuar com o resto da migration

### Erro: "column already exists"
- Significa que o campo já foi adicionado
- Pode continuar com o resto da migration

Todos os comandos usam `IF NOT EXISTS` ou verificações, então são seguros para executar múltiplas vezes.









