-- public.kanban_modelo.kanban_modelo_id -> sequência kanban_modelo_kanban_modelo_id_seq
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'kanban_modelo'
    ) THEN
        RAISE NOTICE 'Tabela public.kanban_modelo não encontrada. Ignorado.';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'kanban_modelo_kanban_modelo_id_seq'
    ) THEN
        CREATE SEQUENCE public.kanban_modelo_kanban_modelo_id_seq;
    END IF;

    BEGIN
        ALTER SEQUENCE public.kanban_modelo_kanban_modelo_id_seq OWNED BY public.kanban_modelo.kanban_modelo_id;
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        NULL;
    END;

    ALTER TABLE public.kanban_modelo
        ALTER COLUMN kanban_modelo_id SET DEFAULT nextval('public.kanban_modelo_kanban_modelo_id_seq'::regclass);

    PERFORM setval(
        'public.kanban_modelo_kanban_modelo_id_seq',
        COALESCE((SELECT MAX(kanban_modelo_id) FROM public.kanban_modelo), 0) + 1,
        false
    );
END $$;
