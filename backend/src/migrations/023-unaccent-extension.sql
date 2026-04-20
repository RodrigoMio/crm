-- Extensão unaccent: comparações case-insensitive ignorando acentos (ç, Ç, ã, etc.)
-- Usada nas queries via unaccent(lower(...)) (ver database/pg-unaccent-search.ts).
-- Railway/Postgres: normalmente permitido em public; se falhar, use role superuser ou extensão já provisionada.

CREATE EXTENSION IF NOT EXISTS unaccent;
