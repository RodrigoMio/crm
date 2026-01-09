-- Migration: Adicionar suporte a Colaboradores
-- Execute este script no PostgreSQL para adicionar os campos necessários

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
ALTER TABLE usuarios 
ADD CONSTRAINT fk_usuarios_usuario_id_pai 
FOREIGN KEY (usuario_id_pai) 
REFERENCES usuarios(id) 
ON DELETE RESTRICT;

-- 4. Adicionar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_usuarios_usuario_id_pai ON usuarios(usuario_id_pai);

-- 5. Adicionar campo usuario_id_colaborador na tabela leads
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS usuario_id_colaborador INTEGER NULL;

-- 6. Adicionar foreign key para usuario_id_colaborador
ALTER TABLE leads 
ADD CONSTRAINT fk_leads_usuario_id_colaborador 
FOREIGN KEY (usuario_id_colaborador) 
REFERENCES usuarios(id) 
ON DELETE SET NULL;

-- 7. Adicionar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_leads_usuario_id_colaborador ON leads(usuario_id_colaborador);

-- 8. Comentários para documentação
COMMENT ON COLUMN usuarios.usuario_id_pai IS 'Referência ao usuário Agente pai (apenas para COLABORADOR)';
COMMENT ON COLUMN leads.usuario_id_colaborador IS 'Referência ao usuário Colaborador responsável pelo lead';

