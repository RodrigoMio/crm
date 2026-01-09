# 🔧 Solução: Erro 500 ao Listar Leads

## ❌ Erro Encontrado

```
500 Internal Server Error
GET /api/leads?page=1&limit=100
```

## 🔍 Causa

O erro 500 pode ser causado por:

1. **Problema no Join do Colaborador** - A relação `colaborador` na entidade Lead pode não estar configurada corretamente
2. **Query SQL com Subquery** - A subquery direta pode estar causando problemas
3. **Relação Inversa Faltando** - A entidade User não tinha a relação inversa `leadsColaborador`

## ✅ Correções Aplicadas

### 1. Refatoração da Query para Agentes

**Antes:**
```typescript
queryBuilder.where(
  '(lead.vendedor_id = :userId OR lead.usuario_id_colaborador IN (SELECT id FROM usuarios WHERE usuario_id_pai = :userId AND perfil = :colaboradorPerfil))',
  { 
    userId: currentUser.id,
    colaboradorPerfil: UserProfile.COLABORADOR
  }
);
```

**Depois:**
```typescript
// Busca IDs dos colaboradores do agente primeiro
const colaboradoresDoAgente = await this.usersRepository.find({
  where: { 
    usuario_id_pai: currentUser.id, 
    perfil: UserProfile.COLABORADOR 
  },
  select: ['id'],
});
const idsColaboradores = colaboradoresDoAgente.map(c => c.id);

if (idsColaboradores.length > 0) {
  queryBuilder.where(
    '(lead.vendedor_id = :userId OR lead.usuario_id_colaborador IN (:...colaboradorIds))',
    { 
      userId: currentUser.id,
      colaboradorIds: idsColaboradores
    }
  );
} else {
  // Se não tem colaboradores, vê apenas seus próprios leads
  queryBuilder.where('lead.vendedor_id = :userId', { userId: currentUser.id });
}
```

### 2. Adição da Relação Inversa na Entidade User

**Adicionado:**
```typescript
// Relacionamento: um usuário pode ter vários leads como colaborador
@OneToMany(() => Lead, (lead) => lead.colaborador)
leadsColaborador: Lead[];
```

### 3. Tratamento de Erro Melhorado

**Adicionado:**
```typescript
try {
  const data = await queryBuilder.getMany();
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
} catch (error) {
  console.error('Erro ao buscar leads:', error);
  console.error('Query SQL:', queryBuilder.getSql());
  console.error('Parâmetros:', queryBuilder.getParameters());
  throw new BadRequestException(`Erro ao buscar leads: ${error.message}`);
}
```

## 🔄 Como Testar

1. **Reinicie o backend:**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Verifique os logs** - Se ainda houver erro, os logs agora mostrarão:
   - A query SQL gerada
   - Os parâmetros usados
   - A mensagem de erro completa

3. **Teste no frontend:**
   - Acesse a lista de leads
   - Verifique se carrega corretamente

## 📝 Notas

- A nova abordagem busca os colaboradores primeiro e depois usa seus IDs na query
- Isso evita problemas com subqueries SQL diretas
- O tratamento de erro melhorado ajuda a identificar problemas futuros

---

**Status: ✅ Correções aplicadas - Reinicie o backend para testar**






