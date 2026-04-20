-- public.kanban_status.kanban_status_id -> sequência kanban_status_kanban_status_id_seq
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'kanban_status'
    ) THEN
        RAISE NOTICE 'Tabela public.kanban_status não encontrada. Ignorado.';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'kanban_status_kanban_status_id_seq'
    ) THEN
        CREATE SEQUENCE public.kanban_status_kanban_status_id_seq;
    END IF;

    BEGIN
        ALTER SEQUENCE public.kanban_status_kanban_status_id_seq OWNED BY public.kanban_status.kanban_status_id;
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        NULL;
    END;

    ALTER TABLE public.kanban_status
        ALTER COLUMN kanban_status_id SET DEFAULT nextval('public.kanban_status_kanban_status_id_seq'::regclass);

    PERFORM setval(
        'public.kanban_status_kanban_status_id_seq',
        COALESCE((SELECT MAX(kanban_status_id) FROM public.kanban_status), 0) + 1,
        false
    );
END $$;
