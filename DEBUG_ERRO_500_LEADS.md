# 🔍 Debug: Erro 500 ao Listar Leads

## ❌ Problema

Erro 500 ao listar leads para usuário COLABORADOR. A tela fica em "Carregando..." e não exibe os leads.

## 🔧 Correções Aplicadas

### 1. Normalização do Perfil

**Problema:** O perfil agora é VARCHAR, então a comparação direta com enum pode falhar.

**Solução:**
```typescript
// Normaliza o perfil para comparação (pode vir como string do banco)
const userPerfil = String(currentUser.perfil).toUpperCase();

if (userPerfil === UserProfile.AGENTE) {
  // ...
} else if (userPerfil === UserProfile.COLABORADOR) {
  // ...
}
```

### 2. Conversão de ID para Number

**Problema:** O ID pode vir como string do JWT.

**Solução:**
```typescript
const userId = typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id;
```

### 3. Join do Colaborador Temporariamente Removido

**Problema:** O join do colaborador pode estar causando erro.

**Solução:** Temporariamente removido para testar se é a causa do erro.

### 4. Logs de Debug Adicionados

Logs detalhados foram adicionados para identificar o problema:
- Perfil do usuário e tipo
- Comparação com enum
- Query SQL gerada
- Parâmetros usados
- Erro completo (se houver)

## 📋 Próximos Passos

1. **Reinicie o backend:**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Teste novamente** e verifique os logs no console do backend

3. **Envie os logs** que aparecerem quando você fizer a requisição

## 🔍 O que Verificar nos Logs

Procure por estas mensagens no console do backend:

```
[LeadsService] Perfil do usuário: ...
[LeadsService] Normalizado: ...
[LeadsService] Colaborador - userId: ...
[LeadsService] Buscando leads para usuário: ...
[LeadsService] Leads encontrados: ...
[LeadsService] Erro ao buscar leads: ... (se houver erro)
```

## ⚠️ Possíveis Causas

1. **Join do Colaborador** - Pode estar causando erro SQL
2. **Comparação de Perfil** - Pode não estar funcionando corretamente
3. **Tipo do ID** - Pode estar vindo como string
4. **Query SQL** - Pode estar gerando SQL inválido

## ✅ Teste Rápido

Para testar se o problema é o join do colaborador, o código atual já está sem o join. Se funcionar, sabemos que o problema é o join.

---

**Status: ⏳ Aguardando logs do backend para diagnóstico completo**






