-- Migration: created_at em occurrences com default no banco
-- Evita NULL quando o INSERT não envia a coluna (TypeORM / scripts / restores).

ALTER TABLE public.occurrences
    ALTER COLUMN created_at SET DEFAULT NOW();

UPDATE public.occurrences
SET created_at = NOW()
WHERE created_at IS NULL;
