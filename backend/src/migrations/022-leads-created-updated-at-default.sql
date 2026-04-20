-- Migration: created_at / updated_at em leads (evitar NULL)
-- + trigger para manter updated_at em UPDATEs feitos sem o campo.

ALTER TABLE public.leads
    ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE public.leads
    ALTER COLUMN updated_at SET DEFAULT NOW();

UPDATE public.leads
SET created_at = NOW()
WHERE created_at IS NULL;

UPDATE public.leads
SET updated_at = COALESCE(created_at, NOW())
WHERE updated_at IS NULL;

CREATE OR REPLACE FUNCTION public.trg_leads_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := clock_timestamp();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
DROP TRIGGER IF EXISTS trg_leads_set_updated_at ON public.leads;

CREATE TRIGGER trg_leads_set_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_leads_set_updated_at();
