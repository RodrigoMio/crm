-- public.leads.id -> sequência leads_id_seq
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'leads'
    ) THEN
        RAISE NOTICE 'Tabela public.leads não encontrada. Ignorado.';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'leads_id_seq'
    ) THEN
        CREATE SEQUENCE public.leads_id_seq;
    END IF;

    BEGIN
        ALTER SEQUENCE public.leads_id_seq OWNED BY public.leads.id;
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        NULL;
    END;

    ALTER TABLE public.leads
        ALTER COLUMN id SET DEFAULT nextval('public.leads_id_seq'::regclass);

    PERFORM setval(
        'public.leads_id_seq',
        COALESCE((SELECT MAX(id) FROM public.leads), 0) + 1,
        false
    );
END $$;
