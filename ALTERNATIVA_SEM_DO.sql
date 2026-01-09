-- ============================================
-- ALTERNATIVA: Adicionar COLABORADOR ao ENUM
-- Use esta versão se o bloco DO não funcionar
-- ============================================

-- Método 1: Executar diretamente (pode funcionar em algumas versões)
-- Tente este primeiro:
ALTER TYPE usuarios_perfil_enum ADD VALUE IF NOT EXISTS 'COLABORADOR';

-- Se o comando acima não funcionar (erro de sintaxe), use o Método 2 abaixo:

-- ============================================
-- Método 2: Criar função temporária
-- ============================================

-- Criar função que adiciona o valor ao enum
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
            -- Adiciona o valor ao enum
            ALTER TYPE usuarios_perfil_enum ADD VALUE 'COLABORADOR';
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Executar a função
SELECT add_colaborador_to_enum();

-- Remover a função após uso (opcional)
DROP FUNCTION IF EXISTS add_colaborador_to_enum();






