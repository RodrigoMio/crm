-- ============================================
-- FUNÇÃO CORRIGIDA: Adicionar COLABORADOR ao ENUM
-- Use EXECUTE para DDL dentro de função
-- ============================================

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









