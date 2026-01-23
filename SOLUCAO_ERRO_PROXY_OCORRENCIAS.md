# 🔧 Solução: Erro de Proxy - Ocorrências

## ❌ Erro Encontrado

```
http proxy error at /api/leads/335/occurrences:
AggregateError [ENOBUFS]
```

## 🔍 Causa

O erro `ENOBUFS` indica que o Vite não conseguiu conectar ao backend. Isso geralmente acontece quando:

1. **Backend não está rodando** - O servidor NestJS não está ativo na porta 3001
2. **Backend não foi reiniciado** - Após adicionar o novo módulo de ocorrências, o backend precisa ser reiniciado
3. **Erro de compilação** - O backend pode ter erros que impedem o servidor de iniciar

## ✅ Solução

### 1. Verificar se o Backend está Rodando

Abra um terminal e verifique se há um processo Node.js rodando na porta 3001:

```bash
# Windows PowerShell
netstat -ano | findstr :3001

# Ou verifique no gerenciador de tarefas se há um processo node.exe
```

### 2. Reiniciar o Backend

**IMPORTANTE:** Após adicionar o novo módulo `OccurrencesModule`, você **DEVE** reiniciar o backend:

```bash
# Pare o backend atual (Ctrl+C no terminal onde está rodando)

# Entre na pasta do backend
cd backend

# Reinstale dependências (se necessário)
npm install

# Faça build
npm run build

# Inicie o servidor
npm run start:dev
```

### 3. Verificar Logs do Backend

Ao iniciar o backend, você deve ver mensagens como:

```
🚀 Backend rodando na porta 3001
📡 API disponível em http://localhost:3001/api
```

Se houver erros, eles aparecerão no console.

### 4. Verificar Rotas Registradas

Após iniciar o backend, você pode verificar se as rotas de ocorrências foram registradas corretamente. O NestJS deve registrar:

- `GET /api/leads/:leadId/occurrences`
- `POST /api/leads/:leadId/occurrences`
- `DELETE /api/leads/:leadId/occurrences/:id`

### 5. Testar a Rota Manualmente

Você pode testar se a rota está funcionando usando curl ou Postman:

```bash
# Exemplo (substitua o token JWT)
curl -X GET http://localhost:3001/api/leads/335/occurrences \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

## 🔄 Passos Completos para Resolver

1. **Pare o backend** (se estiver rodando)
2. **Pare o frontend** (se estiver rodando)
3. **Entre na pasta backend:**
   ```bash
   cd backend
   ```
4. **Faça build:**
   ```bash
   npm run build
   ```
5. **Inicie o backend:**
   ```bash
   npm run start:dev
   ```
6. **Aguarde o backend iniciar completamente**
7. **Em outro terminal, inicie o frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
8. **Teste novamente** - O erro deve desaparecer

## ⚠️ Possíveis Erros Adicionais

### Erro: "Cannot find module 'occurrences'"

**Solução:** Verifique se o `OccurrencesModule` está importado no `AppModule`:

```typescript
// backend/src/app.module.ts
import { OccurrencesModule } from './occurrences/occurrences.module';

@Module({
  imports: [
    // ...
    OccurrencesModule, // Deve estar aqui
  ],
})
```

### Erro: "TypeORM cannot find entity Occurrence"

**Solução:** Verifique se a entidade está registrada no TypeORM:

```typescript
// backend/src/occurrences/occurrences.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([Occurrence]), // Deve estar aqui
    LeadsModule,
  ],
  // ...
})
```

### Erro: "LeadsService is not exported"

**Solução:** Verifique se o `LeadsModule` exporta o `LeadsService`:

```typescript
// backend/src/leads/leads.module.ts
@Module({
  // ...
  exports: [LeadsService], // Deve estar aqui
})
```

## ✅ Verificação Final

Após reiniciar o backend, você deve conseguir:

1. ✅ Abrir o modal de ocorrências sem erros
2. ✅ Listar ocorrências do lead
3. ✅ Criar nova ocorrência
4. ✅ Excluir ocorrência (se permitido)

---

**Status: ✅ Problema resolvido após reiniciar o backend**









