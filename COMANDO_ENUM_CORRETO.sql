-- ============================================
-- COMANDO CORRETO PARA ADICIONAR COLABORADOR AO ENUM
-- ============================================
-- IMPORTANTE: Use "DO" (não "DD")

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






