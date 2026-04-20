"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pgUnaccentLower = pgUnaccentLower;
exports.pgWhereUnaccentContains = pgWhereUnaccentContains;
exports.pgWhereUnaccentEquals = pgWhereUnaccentEquals;
exports.pgWhereUnaccentIn = pgWhereUnaccentIn;
function pgUnaccentLower(expr) {
    return `unaccent(lower(${expr}))`;
}
function pgWhereUnaccentContains(columnExpr, paramName) {
    return `${pgUnaccentLower(columnExpr)} LIKE ${pgUnaccentLower(`:${paramName}`)}`;
}
function pgWhereUnaccentEquals(columnExpr, paramName) {
    return `${pgUnaccentLower(columnExpr)} = ${pgUnaccentLower(`:${paramName}`)}`;
}
function pgWhereUnaccentIn(columnExpr, arrayParamName) {
    return `${pgUnaccentLower(columnExpr)} IN (SELECT ${pgUnaccentLower('trim(elem)')} FROM unnest(:${arrayParamName}::text[]) AS u(elem))`;
}
//# sourceMappingURL=pg-unaccent-search.js.map