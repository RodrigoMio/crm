# 🔧 Solução: Erro ECONNREFUSED no Ambiente Local

## 🔍 Diagnóstico

O erro `ECONNREFUSED` significa que o **backend não está rodando**.

O Vite está tentando fazer proxy para `http://localhost:3001`, mas não encontra o servidor.

---

## ✅ SOLUÇÃO RÁPIDA

### 1️⃣ Iniciar o Backend

Abra um **novo terminal** e execute:

```powershell
cd backend
npm run start:dev
```

**Você deve ver:**
```
🚀 Backend rodando na porta 3001
📡 API disponível em http://localhost:3001/api
```

**⚠️ IMPORTANTE:** Deixe este terminal aberto! O backend precisa estar rodando.

---

### 2️⃣ Verificar se Backend Está Rodando

Em outro terminal, teste:

```powershell
# Testar se backend responde
curl http://localhost:3001/api

# Ou acesse no navegador:
# http://localhost:3001/api
```

**Se funcionar:** Backend está OK ✅  
**Se não funcionar:** Veja "Problemas Comuns" abaixo

---

### 3️⃣ Frontend Já Deve Funcionar

Se o frontend já está rodando (`npm run dev`), ele deve funcionar automaticamente agora.

Se não estiver rodando, inicie em outro terminal:

```powershell
cd frontend
npm run dev
```

---

## 🐛 PROBLEMAS COMUNS

### Problema 1: Backend não inicia

**Erro:** "Cannot find module" ou erros de dependências

**Solução:**
```powershell
cd backend
npm install
npm run start:dev
```

---

### Problema 2: Erro de conexão com banco

**Erro:** "Connection refused" ou "ECONNREFUSED" no banco

**Solução:**

1. **Verificar se PostgreSQL está rodando:**
   ```powershell
   # Windows (PowerShell)
   Get-Service -Name postgresql*
   
   # Se não estiver rodando, inicie:
   Start-Service postgresql-x64-XX
   ```

2. **Verificar `.env` do backend:**
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=sua_senha
   DB_DATABASE=crm_leads
   ```

3. **Testar conexão:**
   ```powershell
   cd backend
   npm run test-connection
   ```

---

### Problema 3: Porta 3001 já está em uso

**Erro:** "Port 3001 is already in use"

**Solução:**

1. **Encontrar processo usando a porta:**
   ```powershell
   # Windows
   netstat -ano | findstr :3001
   
   # Ver qual processo está usando
   tasklist | findstr <PID>
   ```

2. **Matar o processo:**
   ```powershell
   taskkill /PID <PID> /F
   ```

3. **Ou usar outra porta:**

   Edite `backend/.env`:
   ```env
   PORT=3002
   ```

   E edite `frontend/vite.config.ts`:
   ```typescript
   proxy: {
     '/api': {
       target: 'http://localhost:3002',  // Mudar aqui
       ...
     }
   }
   ```

---

### Problema 4: Banco de dados não existe

**Erro:** "database does not exist"

**Solução:**

1. **Criar banco de dados:**
   ```sql
   CREATE DATABASE crm_leads;
   ```

2. **Ou usar script:**
   ```powershell
   cd backend
   npm run create-database
   ```

---

## 📋 CHECKLIST

- [ ] Backend está rodando (`npm run start:dev` no terminal)
- [ ] Backend responde em `http://localhost:3001/api`
- [ ] PostgreSQL está rodando
- [ ] `.env` do backend está configurado corretamente
- [ ] Frontend está rodando (`npm run dev`)
- [ ] Erro `ECONNREFUSED` desapareceu

---

## 🚀 COMANDOS RÁPIDOS

### Iniciar Tudo (2 Terminais)

**Terminal 1 - Backend:**
```powershell
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

### Verificar Status

```powershell
# Backend
curl http://localhost:3001/api

# Frontend
# Acesse: http://localhost:3000
```

---

## 💡 DICA

**Sempre inicie o backend ANTES do frontend!**

O frontend depende do backend estar rodando para funcionar corretamente.

---

## 📚 Estrutura de Portas

| Serviço | Porta | URL |
|---------|-------|-----|
| Frontend (Vite) | 3000 | http://localhost:3000 |
| Backend (NestJS) | 3001 | http://localhost:3001 |
| PostgreSQL | 5432 | localhost:5432 |

O Vite faz proxy de `/api` → `http://localhost:3001/api`

---

## 🎯 RESUMO

**Problema:** Backend não está rodando  
**Solução:** `cd backend && npm run start:dev`  
**Resultado:** Erro `ECONNREFUSED` desaparece

**Conclusão:** Sempre tenha o backend rodando quando desenvolver! 🎉



