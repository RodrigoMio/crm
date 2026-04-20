-- Migration: garantir geração automática de ID em leads_produto
-- Objetivo: corrigir ambientes onde leads_produto.leads_produto_id perdeu DEFAULT/sequence
-- Segurança: script idempotente (pode rodar mais de uma vez)

DO $$
BEGIN
    -- Garante que a tabela existe antes de aplicar ajustes.
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'leads_produto'
    ) THEN
        RAISE NOTICE 'Tabela public.leads_produto não encontrada. Migração ignorada.';
        RETURN;
    END IF;

    -- Garante que a sequência exista.
    IF NOT EXISTS (
        SELECT 1
        FROM pg_sequences
        WHERE schemaname = 'public'
          AND sequencename = 'leads_produto_leads_produto_id_seq'
    ) THEN
        CREATE SEQUENCE public.leads_produto_leads_produto_id_seq;
        RAISE NOTICE 'Sequência public.leads_produto_leads_produto_id_seq criada.';
    ELSE
        RAISE NOTICE 'Sequência public.leads_produto_leads_produto_id_seq já existe.';
    END IF;

    -- Vincula ownership da sequência à coluna leads_produto_id.
    BEGIN
        ALTER SEQUENCE public.leads_produto_leads_produto_id_seq
            OWNED BY public.leads_produto.leads_produto_id;
    EXCEPTION
        WHEN undefined_table OR undefined_column THEN
            RAISE NOTICE 'Não foi possível vincular ownership (tabela/coluna ausente).';
    END;

    -- Define DEFAULT da coluna para usar a sequência.
    ALTER TABLE public.leads_produto
        ALTER COLUMN leads_produto_id SET DEFAULT nextval('public.leads_produto_leads_produto_id_seq'::regclass);

    -- Ajusta valor atual da sequência para próximo id válido.
    PERFORM setval(
        'public.leads_produto_leads_produto_id_seq',
        COALESCE((SELECT MAX(leads_produto_id) FROM public.leads_produto), 0) + 1,
        false
    );

    RAISE NOTICE 'DEFAULT e sequência de public.leads_produto.leads_produto_id ajustados com sucesso.';
END $$;

