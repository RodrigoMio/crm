-- Migration: Criar tabela appointments (agendamentos)
-- Execute este script no PostgreSQL

-- 1. Criar enum para status de agendamento (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
    CREATE TYPE appointment_status AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
  END IF;
END $$;

-- 2. Criar tabela appointments
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  data_agendamento TIMESTAMPTZ NOT NULL,
  status appointment_status NOT NULL DEFAULT 'SCHEDULED',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_appointments_lead_id ON appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_data_agendamento ON appointments(data_agendamento);
CREATE INDEX IF NOT EXISTS idx_appointments_usuario_id ON appointments(usuario_id);

-- 4. Criar índice único parcial para garantir apenas um SCHEDULED por lead
-- Usa índice parcial (partial index) para garantir constraint de negócio
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_lead_scheduled 
ON appointments(lead_id) 
WHERE status = 'SCHEDULED';

-- 5. Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION update_appointments_updated_at();





