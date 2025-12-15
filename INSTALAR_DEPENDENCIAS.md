# 📦 Como Instalar as Dependências

## ⚠️ IMPORTANTE: Execute os comandos nos diretórios corretos!

## Passo 1: Instalar dependências do Frontend

Abra o PowerShell e execute:

```powershell
cd C:\Users\rjmio\projetos-cursor\CRM\frontend
npm install
```

**Aguarde a instalação terminar** (pode levar 2-5 minutos)

Você verá mensagens como:
- `added XXX packages`
- `found 0 vulnerabilities` (ou algumas vulnerabilidades que podem ser ignoradas)

## Passo 2: Instalar dependências do Backend

Em **outro terminal** ou após terminar o frontend:

```powershell
cd C:\Users\rjmio\projetos-cursor\CRM\backend
npm install
```

**Aguarde a instalação terminar**

## Passo 3: Verificar se funcionou

Após instalar, tente rodar o frontend:

```powershell
cd C:\Users\rjmio\projetos-cursor\CRM\frontend
npm run dev
```

Se aparecer algo como:
```
VITE v4.x.x  ready in xxx ms
➜  Local:   http://localhost:3000/
```

✅ **Funcionou!** O frontend está rodando.

---

## 🔍 Como saber se está no diretório certo?

Antes de executar `npm install`, verifique se você está no diretório correto:

**Para Frontend:**
```powershell
Get-Location
# Deve mostrar: C:\Users\rjmio\projetos-cursor\CRM\frontend

# Verificar se package.json existe:
Test-Path package.json
# Deve retornar: True
```

**Para Backend:**
```powershell
Get-Location
# Deve mostrar: C:\Users\rjmio\projetos-cursor\CRM\backend

# Verificar se package.json existe:
Test-Path package.json
# Deve retornar: True
```

---

## ❌ Erros comuns

### "npm WARN enoent ENOENT: no such file or directory, open 'package.json'"
**Causa:** Você está no diretório errado  
**Solução:** Navegue para o diretório correto (`frontend` ou `backend`)

### "npm ERR! code ELIFECYCLE"
**Causa:** Dependências não instaladas ou instalação incompleta  
**Solução:** Execute `npm install` novamente no diretório correto

### "Cannot find module 'vite'"
**Causa:** Dependências do frontend não foram instaladas  
**Solução:** Execute `npm install` dentro da pasta `frontend`



