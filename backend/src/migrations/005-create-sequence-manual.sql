-- Migration: Criar sequência para leads.id manualmente
-- Execute este script no PostgreSQL ANTES de iniciar o backend

-- Verificar se a sequência já existe
DO $$ 
BEGIN
    -- Se a sequência não existir, criar
    IF NOT EXISTS (
        SELECT 1 FROM pg_sequences WHERE sequencename = 'leads_id_seq'
    ) THEN
        -- Criar a sequência (sem IF NOT EXISTS, pois já verificamos acima)
        CREATE SEQUENCE leads_id_seq OWNED BY leads.id;
        
        -- Definir o valor inicial baseado no maior ID existente
        PERFORM setval('leads_id_seq', COALESCE((SELECT MAX(id) FROM leads), 0) + 1, false);
        
        RAISE NOTICE 'Sequência leads_id_seq criada com sucesso.';
    ELSE
        RAISE NOTICE 'Sequência leads_id_seq já existe.';
    END IF;
END $$;

-- Verificar se a coluna id está usando a sequência corretamente
DO $$ 
BEGIN
    -- Se a coluna não estiver usando a sequência, atualizar
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'id' 
        AND column_default LIKE '%leads_id_seq%'
    ) THEN
        -- Atualizar a coluna para usar a sequência
        ALTER TABLE leads 
        ALTER COLUMN id SET DEFAULT nextval('leads_id_seq');
        
        RAISE NOTICE 'Coluna id configurada para usar a sequência leads_id_seq.';
    ELSE
        RAISE NOTICE 'Coluna id já está usando a sequência corretamente.';
    END IF;
END $$;









