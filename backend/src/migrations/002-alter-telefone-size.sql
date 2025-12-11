-- Migration: Alterar tamanho do campo telefone para VARCHAR(255)
-- Execute este script se o banco de dados já existir e o campo telefone ainda for VARCHAR(20)

-- Altera o tamanho do campo telefone na tabela leads
ALTER TABLE leads ALTER COLUMN telefone TYPE VARCHAR(255);

