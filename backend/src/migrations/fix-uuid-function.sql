-- Script para corrigir a função generate_uuid()
-- Execute este script se estiver recebendo erro: "function uuid_generate_v4() does not exist"

-- Remove a função antiga se existir
DROP FUNCTION IF EXISTS generate_uuid();

-- Cria a nova função sem depender de extensões
CREATE OR REPLACE FUNCTION generate_uuid()
RETURNS UUID AS $$
DECLARE
    v_uuid TEXT;
BEGIN
    -- Gera UUID v4 manualmente (formato: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
    -- onde x é hexadecimal e y é um de 8, 9, A, ou B
    v_uuid := 
        lpad(to_hex((random() * 4294967295)::bigint), 8, '0') ||
        '-' ||
        lpad(to_hex((random() * 65535)::int), 4, '0') ||
        '-4' ||
        lpad(to_hex((random() * 4095)::int), 3, '0') ||
        '-' ||
        lpad(to_hex(((random() * 16383)::int | 32768)), 4, '0') ||
        '-' ||
        lpad(to_hex((random() * 281474976710655)::bigint), 12, '0');
    
    RETURN v_uuid::uuid;
END;
$$ LANGUAGE plpgsql;









