-- Migration: Remover coluna itens_interesse da tabela leads
-- Execute este script no PostgreSQL para remover a coluna itens_interesse

-- 1. Remover a coluna itens_interesse (se existir)
ALTER TABLE leads DROP COLUMN IF EXISTS itens_interesse;

-- Verificação: Confirmar que a coluna foi removida
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'itens_interesse'
    ) THEN
        RAISE NOTICE 'AVISO: A coluna itens_interesse ainda existe. Verifique se há dependências.';
    ELSE
        RAISE NOTICE 'SUCESSO: A coluna itens_interesse foi removida com sucesso.';
    END IF;
END $$;

