-- public.produto_tipo.produto_tipo_id -> sequência produto_tipo_produto_tipo_id_seq
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'produto_tipo'
    ) THEN
        RAISE NOTICE 'Tabela public.produto_tipo não encontrada. Ignorado.';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'produto_tipo_produto_tipo_id_seq'
    ) THEN
        CREATE SEQUENCE public.produto_tipo_produto_tipo_id_seq;
    END IF;

    BEGIN
        ALTER SEQUENCE public.produto_tipo_produto_tipo_id_seq OWNED BY public.produto_tipo.produto_tipo_id;
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        NULL;
    END;

    ALTER TABLE public.produto_tipo
        ALTER COLUMN produto_tipo_id SET DEFAULT nextval('public.produto_tipo_produto_tipo_id_seq'::regclass);

    PERFORM setval(
        'public.produto_tipo_produto_tipo_id_seq',
        COALESCE((SELECT MAX(produto_tipo_id) FROM public.produto_tipo), 0) + 1,
        false
    );
END $$;
