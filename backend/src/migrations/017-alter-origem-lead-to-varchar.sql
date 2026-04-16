-- Permite salvar slug dinâmico em leads.origem_lead (captura via landing page)
-- Execute manualmente no banco se origem_lead ainda for enum.

ALTER TABLE leads
  ALTER COLUMN origem_lead TYPE VARCHAR(255)
  USING origem_lead::text;

ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_origem_lead_check;

