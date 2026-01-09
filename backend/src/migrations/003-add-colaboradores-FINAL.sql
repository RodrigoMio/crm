-- Migration: Adicionar suporte a Colaboradores (VERSÃO FINAL)
-- Execute este script completo no PostgreSQL

-- ============================================
-- PASSO 1: Adicionar 'COLABORADOR' ao ENUM
-- ============================================
-- IMPORTANTE: Este comando deve ser executado em um bloco DO
-- e não pode estar dentro de uma transação explícita

DO $$ 
BEGIN
    -- Verifica se o enum existe e adiciona 'COLABORADOR' se não existir
    IF EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'usuarios_perfil_enum'
    ) THEN
        -- Verifica se 'COLABORADOR' já existe no enum
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

-- ============================================
-- PASSO 2: Adicionar campo usuario_id_pai
-- ============================================
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS usuario_id_pai INTEGER NULL;

-- ============================================
-- PASSO 3: Adicionar Foreign Key usuario_id_pai
-- ============================================
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

-- ============================================
-- PASSO 4: Criar índice para usuario_id_pai
-- ============================================
CREATE INDEX IF NOT EXISTS idx_usuarios_usuario_id_pai 
ON usuarios(usuario_id_pai);

-- ============================================
-- PASSO 5: Adicionar campo usuario_id_colaborador em leads
-- ============================================
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS usuario_id_colaborador INTEGER NULL;

-- ============================================
-- PASSO 6: Adicionar Foreign Key usuario_id_colaborador
-- ============================================
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

-- ============================================
-- PASSO 7: Criar índice para usuario_id_colaborador
-- ============================================
CREATE INDEX IF NOT EXISTS idx_leads_usuario_id_colaborador 
ON leads(usuario_id_colaborador);

-- ============================================
-- PASSO 8: Adicionar comentários (opcional)
-- ============================================
COMMENT ON COLUMN usuarios.usuario_id_pai IS 'Referência ao usuário Agente pai (apenas para COLABORADOR)';
COMMENT ON COLUMN leads.usuario_id_colaborador IS 'Referência ao usuário Colaborador responsável pelo lead';






