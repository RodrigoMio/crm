-- public.landing_pages.id -> sequência landing_pages_id_seq
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'landing_pages'
    ) THEN
        RAISE NOTICE 'Tabela public.landing_pages não encontrada. Ignorado.';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'landing_pages_id_seq'
    ) THEN
        CREATE SEQUENCE public.landing_pages_id_seq;
    END IF;

    BEGIN
        ALTER SEQUENCE public.landing_pages_id_seq OWNED BY public.landing_pages.id;
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        NULL;
    END;

    ALTER TABLE public.landing_pages
        ALTER COLUMN id SET DEFAULT nextval('public.landing_pages_id_seq'::regclass);

    PERFORM setval(
        'public.landing_pages_id_seq',
        COALESCE((SELECT MAX(id) FROM public.landing_pages), 0) + 1,
        false
    );
END $$;
