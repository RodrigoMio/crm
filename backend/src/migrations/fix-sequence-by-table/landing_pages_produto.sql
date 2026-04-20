-- public.landing_pages_produto.id -> sequência landing_pages_produto_id_seq
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'landing_pages_produto'
    ) THEN
        RAISE NOTICE 'Tabela public.landing_pages_produto não encontrada. Ignorado.';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'landing_pages_produto_id_seq'
    ) THEN
        CREATE SEQUENCE public.landing_pages_produto_id_seq;
    END IF;

    BEGIN
        ALTER SEQUENCE public.landing_pages_produto_id_seq OWNED BY public.landing_pages_produto.id;
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        NULL;
    END;

    ALTER TABLE public.landing_pages_produto
        ALTER COLUMN id SET DEFAULT nextval('public.landing_pages_produto_id_seq'::regclass);

    PERFORM setval(
        'public.landing_pages_produto_id_seq',
        COALESCE((SELECT MAX(id) FROM public.landing_pages_produto), 0) + 1,
        false
    );
END $$;
