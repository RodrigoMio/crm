-- public.leads_produto.leads_produto_id -> sequência leads_produto_leads_produto_id_seq
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'leads_produto'
    ) THEN
        RAISE NOTICE 'Tabela public.leads_produto não encontrada. Ignorado.';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'leads_produto_leads_produto_id_seq'
    ) THEN
        CREATE SEQUENCE public.leads_produto_leads_produto_id_seq;
    END IF;

    BEGIN
        ALTER SEQUENCE public.leads_produto_leads_produto_id_seq OWNED BY public.leads_produto.leads_produto_id;
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        NULL;
    END;

    ALTER TABLE public.leads_produto
        ALTER COLUMN leads_produto_id SET DEFAULT nextval('public.leads_produto_leads_produto_id_seq'::regclass);

    PERFORM setval(
        'public.leads_produto_leads_produto_id_seq',
        COALESCE((SELECT MAX(leads_produto_id) FROM public.leads_produto), 0) + 1,
        false
    );
END $$;
