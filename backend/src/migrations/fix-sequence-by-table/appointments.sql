-- public.appointments.id -> sequência appointments_id_seq
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'appointments'
    ) THEN
        RAISE NOTICE 'Tabela public.appointments não encontrada. Ignorado.';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'appointments_id_seq'
    ) THEN
        CREATE SEQUENCE public.appointments_id_seq;
    END IF;

    BEGIN
        ALTER SEQUENCE public.appointments_id_seq OWNED BY public.appointments.id;
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        NULL;
    END;

    ALTER TABLE public.appointments
        ALTER COLUMN id SET DEFAULT nextval('public.appointments_id_seq'::regclass);

    PERFORM setval(
        'public.appointments_id_seq',
        COALESCE((SELECT MAX(id) FROM public.appointments), 0) + 1,
        false
    );
END $$;
