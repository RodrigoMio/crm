-- public.usuarios.id -> sequência usuarios_id_seq
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'usuarios'
    ) THEN
        RAISE NOTICE 'Tabela public.usuarios não encontrada. Ignorado.';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'usuarios_id_seq'
    ) THEN
        CREATE SEQUENCE public.usuarios_id_seq;
    END IF;

    BEGIN
        ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        NULL;
    END;

    ALTER TABLE public.usuarios
        ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);

    PERFORM setval(
        'public.usuarios_id_seq',
        COALESCE((SELECT MAX(id) FROM public.usuarios), 0) + 1,
        false
    );
END $$;
