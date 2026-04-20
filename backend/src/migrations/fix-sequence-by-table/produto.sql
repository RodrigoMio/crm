-- public.produto.produto_id -> sequência produto_produto_id_seq
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'produto'
    ) THEN
        RAISE NOTICE 'Tabela public.produto não encontrada. Ignorado.';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'produto_produto_id_seq'
    ) THEN
        CREATE SEQUENCE public.produto_produto_id_seq;
    END IF;

    BEGIN
        ALTER SEQUENCE public.produto_produto_id_seq OWNED BY public.produto.produto_id;
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        NULL;
    END;

    ALTER TABLE public.produto
        ALTER COLUMN produto_id SET DEFAULT nextval('public.produto_produto_id_seq'::regclass);

    PERFORM setval(
        'public.produto_produto_id_seq',
        COALESCE((SELECT MAX(produto_id) FROM public.produto), 0) + 1,
        false
    );
END $$;
