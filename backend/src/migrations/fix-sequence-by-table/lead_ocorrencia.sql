-- public.lead_ocorrencia.lead_ocorrencia_id -> sequência lead_ocorrencia_lead_ocorrencia_id_seq
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'lead_ocorrencia'
    ) THEN
        RAISE NOTICE 'Tabela public.lead_ocorrencia não encontrada. Ignorado.';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'lead_ocorrencia_lead_ocorrencia_id_seq'
    ) THEN
        CREATE SEQUENCE public.lead_ocorrencia_lead_ocorrencia_id_seq;
    END IF;

    BEGIN
        ALTER SEQUENCE public.lead_ocorrencia_lead_ocorrencia_id_seq OWNED BY public.lead_ocorrencia.lead_ocorrencia_id;
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        NULL;
    END;

    ALTER TABLE public.lead_ocorrencia
        ALTER COLUMN lead_ocorrencia_id SET DEFAULT nextval('public.lead_ocorrencia_lead_ocorrencia_id_seq'::regclass);

    PERFORM setval(
        'public.lead_ocorrencia_lead_ocorrencia_id_seq',
        COALESCE((SELECT MAX(lead_ocorrencia_id) FROM public.lead_ocorrencia), 0) + 1,
        false
    );
END $$;
