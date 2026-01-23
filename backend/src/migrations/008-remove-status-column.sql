-- Migration: Remover coluna status da tabela leads
-- Execute este script no PostgreSQL para remover a coluna status e seu índice
-- A coluna status foi substituída por kanban_status_id

-- 1. Remover o índice GIN da coluna status (se existir)
DROP INDEX IF EXISTS idx_leads_status;

-- 2. Remover a coluna status (se existir)
ALTER TABLE leads DROP COLUMN IF EXISTS status;

-- Verificação: Confirmar que a coluna foi removida
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'status'
    ) THEN
        RAISE NOTICE 'AVISO: A coluna status ainda existe. Verifique se há dependências.';
    ELSE
        RAISE NOTICE 'SUCESSO: A coluna status foi removida com sucesso.';
    END IF;
END $$;




