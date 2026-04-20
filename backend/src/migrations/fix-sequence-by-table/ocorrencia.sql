-- public.ocorrencia.ocorrencia_id -> sequência ocorrencia_ocorrencia_id_seq
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'ocorrencia'
    ) THEN
        RAISE NOTICE 'Tabela public.ocorrencia não encontrada. Ignorado.';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'ocorrencia_ocorrencia_id_seq'
    ) THEN
        CREATE SEQUENCE public.ocorrencia_ocorrencia_id_seq;
    END IF;

    BEGIN
        ALTER SEQUENCE public.ocorrencia_ocorrencia_id_seq OWNED BY public.ocorrencia.ocorrencia_id;
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        NULL;
    END;

    ALTER TABLE public.ocorrencia
        ALTER COLUMN ocorrencia_id SET DEFAULT nextval('public.ocorrencia_ocorrencia_id_seq'::regclass);

    PERFORM setval(
        'public.ocorrencia_ocorrencia_id_seq',
        COALESCE((SELECT MAX(ocorrencia_id) FROM public.ocorrencia), 0) + 1,
        false
    );
END $$;
