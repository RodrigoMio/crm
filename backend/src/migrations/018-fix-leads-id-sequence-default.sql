-- Migration: garantir geração automática de ID em leads
-- Objetivo: corrigir ambientes onde leads.id perdeu DEFAULT/sequence
-- Segurança: script idempotente (pode rodar mais de uma vez)

DO $$
BEGIN
    -- Garante que a tabela existe antes de aplicar ajustes.
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'leads'
    ) THEN
        RAISE NOTICE 'Tabela public.leads não encontrada. Migração ignorada.';
        RETURN;
    END IF;

    -- Garante que a sequência exista.
    IF NOT EXISTS (
        SELECT 1
        FROM pg_sequences
        WHERE schemaname = 'public'
          AND sequencename = 'leads_id_seq'
    ) THEN
        CREATE SEQUENCE public.leads_id_seq;
        RAISE NOTICE 'Sequência public.leads_id_seq criada.';
    ELSE
        RAISE NOTICE 'Sequência public.leads_id_seq já existe.';
    END IF;

    -- Vincula ownership da sequência à coluna leads.id.
    BEGIN
        ALTER SEQUENCE public.leads_id_seq OWNED BY public.leads.id;
    EXCEPTION
        WHEN undefined_table OR undefined_column THEN
            RAISE NOTICE 'Não foi possível vincular ownership (tabela/coluna ausente).';
    END;

    -- Define DEFAULT da coluna id para usar a sequência.
    ALTER TABLE public.leads
        ALTER COLUMN id SET DEFAULT nextval('public.leads_id_seq'::regclass);

    -- Ajusta valor atual da sequência para próximo id válido.
    PERFORM setval(
        'public.leads_id_seq',
        COALESCE((SELECT MAX(id) FROM public.leads), 0) + 1,
        false
    );

    RAISE NOTICE 'DEFAULT e sequência de public.leads.id ajustados com sucesso.';
END $$;

