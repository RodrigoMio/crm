-- Migration: corrigir sequências/default de PKs numéricas (global)
-- Objetivo: reparar bancos novos/incompletos onde colunas de PK auto-incremento
--           ficaram sem DEFAULT nextval(...) e/ou sem sequência.
-- Segurança: idempotente (pode executar múltiplas vezes).

DO $$
DECLARE
    r RECORD;
    seq_name TEXT;
    seq_regclass TEXT;
BEGIN
    FOR r IN
        SELECT
            tc.table_name,
            kcu.column_name,
            c.data_type
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
         AND tc.table_name = kcu.table_name
        JOIN information_schema.columns c
          ON c.table_schema = kcu.table_schema
         AND c.table_name = kcu.table_name
         AND c.column_name = kcu.column_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public'
          -- Apenas PK de coluna única
          AND NOT EXISTS (
              SELECT 1
              FROM information_schema.key_column_usage kcu2
              WHERE kcu2.constraint_name = tc.constraint_name
                AND kcu2.table_schema = tc.table_schema
                AND kcu2.table_name = tc.table_name
                AND kcu2.ordinal_position <> kcu.ordinal_position
          )
          -- Apenas tipos numéricos suportados por sequência
          AND c.data_type IN ('smallint', 'integer', 'bigint')
        ORDER BY tc.table_name
    LOOP
        -- Tenta identificar sequência já vinculada (quando existe).
        seq_regclass := pg_get_serial_sequence(
            format('public.%I', r.table_name),
            r.column_name
        );

        -- Se não houver sequência vinculada, cria padrão <tabela>_<coluna>_seq.
        -- Não use format('%I_%I_seq', ...) — gera identificador inválido no PostgreSQL.
        IF seq_regclass IS NULL THEN
            seq_name := r.table_name || '_' || r.column_name || '_seq';

            IF to_regclass('public.' || quote_ident(seq_name)) IS NULL THEN
                EXECUTE format('CREATE SEQUENCE public.%I', seq_name);
                RAISE NOTICE 'Sequência criada: public.%s', seq_name;
            END IF;

            seq_regclass := 'public.' || quote_ident(seq_name);
        END IF;

        -- Garante default da PK usando a sequência.
        EXECUTE format(
            'ALTER TABLE public.%I ALTER COLUMN %I SET DEFAULT nextval(%L::regclass)',
            r.table_name,
            r.column_name,
            seq_regclass
        );

        -- Garante ownership da sequência para a coluna.
        EXECUTE format(
            'ALTER SEQUENCE %s OWNED BY public.%I.%I',
            seq_regclass::regclass::text,
            r.table_name,
            r.column_name
        );

        -- Sincroniza sequência com maior ID atual da tabela.
        EXECUTE format(
            'SELECT setval(%L, COALESCE((SELECT MAX(%I) FROM public.%I), 0) + 1, false)',
            seq_regclass,
            r.column_name,
            r.table_name
        );

        RAISE NOTICE 'PK ajustada: %s.%s -> %s', r.table_name, r.column_name, seq_regclass;
    END LOOP;
END $$;

-- Query opcional de auditoria após execução:
-- Lista PKs de coluna única com default atual e sequência associada.
-- SELECT
--   tc.table_name,
--   kcu.column_name,
--   c.data_type,
--   c.column_default,
--   pg_get_serial_sequence(format('public.%I', tc.table_name), kcu.column_name) AS serial_sequence
-- FROM information_schema.table_constraints tc
-- JOIN information_schema.key_column_usage kcu
--   ON tc.constraint_name = kcu.constraint_name
--  AND tc.table_schema = kcu.table_schema
--  AND tc.table_name = kcu.table_name
-- JOIN information_schema.columns c
--   ON c.table_schema = kcu.table_schema
--  AND c.table_name = kcu.table_name
--  AND c.column_name = kcu.column_name
-- WHERE tc.constraint_type = 'PRIMARY KEY'
--   AND tc.table_schema = 'public'
-- ORDER BY tc.table_name;

