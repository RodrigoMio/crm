-- public.lead_kanban_status.id -> sequência lead_kanban_status_id_seq
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'lead_kanban_status'
    ) THEN
        RAISE NOTICE 'Tabela public.lead_kanban_status não encontrada. Ignorado.';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'lead_kanban_status_id_seq'
    ) THEN
        CREATE SEQUENCE public.lead_kanban_status_id_seq;
    END IF;

    BEGIN
        ALTER SEQUENCE public.lead_kanban_status_id_seq OWNED BY public.lead_kanban_status.id;
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        NULL;
    END;

    ALTER TABLE public.lead_kanban_status
        ALTER COLUMN id SET DEFAULT nextval('public.lead_kanban_status_id_seq'::regclass);

    PERFORM setval(
        'public.lead_kanban_status_id_seq',
        COALESCE((SELECT MAX(id) FROM public.lead_kanban_status), 0) + 1,
        false
    );
END $$;
