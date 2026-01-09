-- Migration: Adicionar coluna total_conversoes na tabela leads
-- Execute este script no PostgreSQL

DO $$
BEGIN
    -- Verifica se a coluna já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'total_conversoes'
    ) THEN
        -- Adiciona a coluna total_conversoes
        ALTER TABLE leads 
        ADD COLUMN total_conversoes INTEGER NULL;

        RAISE NOTICE 'Coluna total_conversoes adicionada à tabela leads.';
    ELSE
        RAISE NOTICE 'Coluna total_conversoes já existe na tabela leads. Nenhuma ação necessária.';
    END IF;
END $$;

