-- public.occurrences.id -> sequência occurrences_id_seq
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'occurrences'
    ) THEN
        RAISE NOTICE 'Tabela public.occurrences não encontrada. Ignorado.';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'occurrences_id_seq'
    ) THEN
        CREATE SEQUENCE public.occurrences_id_seq;
    END IF;

    BEGIN
        ALTER SEQUENCE public.occurrences_id_seq OWNED BY public.occurrences.id;
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        NULL;
    END;

    ALTER TABLE public.occurrences
        ALTER COLUMN id SET DEFAULT nextval('public.occurrences_id_seq'::regclass);

    PERFORM setval(
        'public.occurrences_id_seq',
        COALESCE((SELECT MAX(id) FROM public.occurrences), 0) + 1,
        false
    );
END $$;
