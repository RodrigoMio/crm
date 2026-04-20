/**
 * Busca textual no PostgreSQL: case-insensitive e sem acentos (inclui ç/Ç).
 * Requer no banco: `CREATE EXTENSION IF NOT EXISTS unaccent;` (migration 023).
 */
export function pgUnaccentLower(expr: string): string {
  return `unaccent(lower(${expr}))`;
}

/** LIKE parcial; o parâmetro deve vir com % (ex.: %termo%). */
export function pgWhereUnaccentContains(columnExpr: string, paramName: string): string {
  return `${pgUnaccentLower(columnExpr)} LIKE ${pgUnaccentLower(`:${paramName}`)}`;
}

export function pgWhereUnaccentEquals(columnExpr: string, paramName: string): string {
  return `${pgUnaccentLower(columnExpr)} = ${pgUnaccentLower(`:${paramName}`)}`;
}

/** IN com normalização unaccent(lower) em coluna e em cada elemento do array (parâmetro: string[]). */
export function pgWhereUnaccentIn(columnExpr: string, arrayParamName: string): string {
  return `${pgUnaccentLower(columnExpr)} IN (SELECT ${pgUnaccentLower('trim(elem)')} FROM unnest(:${arrayParamName}::text[]) AS u(elem))`;
}
