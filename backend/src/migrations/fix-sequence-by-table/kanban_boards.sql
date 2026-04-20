-- public.kanban_boards.id -> sequência kanban_boards_id_seq
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'kanban_boards'
    ) THEN
        RAISE NOTICE 'Tabela public.kanban_boards não encontrada. Ignorado.';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'kanban_boards_id_seq'
    ) THEN
        CREATE SEQUENCE public.kanban_boards_id_seq;
    END IF;

    BEGIN
        ALTER SEQUENCE public.kanban_boards_id_seq OWNED BY public.kanban_boards.id;
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        NULL;
    END;

    ALTER TABLE public.kanban_boards
        ALTER COLUMN id SET DEFAULT nextval('public.kanban_boards_id_seq'::regclass);

    PERFORM setval(
        'public.kanban_boards_id_seq',
        COALESCE((SELECT MAX(id) FROM public.kanban_boards), 0) + 1,
        false
    );
END $$;
