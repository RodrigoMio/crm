# 🔍 Diagnóstico: Erro 404 "Cannot GET /api"

## 🔍 Problema

Ao acessar `http://crmcc.nodejsnglf02.kinghost.net:21008/api`, você recebe:
```json
{"message": "Cannot GET /api", "error":"Not Found","statusCode":404}
```

Isso significa que a aplicação está rodando, mas não está encontrando a rota `/api`.

---

## ✅ Diagnóstico Passo a Passo

### Passo 1: Verificar se a Aplicação Está Rodando

```bash
# Conectar via SSH
ssh crmcc@nodejsnglf02

# Verificar processos Node.js
ps aux | grep node

# Verificar se a porta está em uso
netstat -tulpn | grep :21008
# ou
ss -tulpn | grep :21008
```

**O que procurar:**
- Deve aparecer um processo `node` rodando
- A porta 21008 deve estar em uso

---

### Passo 2: Verificar os Logs da Aplicação

No painel da KingHost:
1. Acesse **Aplicações Node.js**
2. Clique na sua aplicação
3. Veja a seção **"Logs"**

**O que procurar:**
- ✅ Mensagem: "Backend rodando na porta 21008"
- ✅ Mensagem: "API disponível em http://localhost:21008/api"
- ✅ Mensagem: "Nest application successfully started"
- ✅ Rotas mapeadas: "Mapped {/api/auth/login, POST} route"

---

### Passo 3: Testar Rotas Específicas

```bash
# Testar rota de login (POST)
curl -X POST http://localhost:21008/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@exemplo.com","senha":"sua_senha"}'

# Testar rota raiz da API
curl http://localhost:21008/api

# Testar se o servidor está respondendo
curl http://localhost:21008/
```

**Resultados esperados:**
- `/api/auth/login` (POST) → Deve retornar token ou erro de validação
- `/api` (GET) → Pode retornar 404 (normal, não há rota GET na raiz)
- `/` (GET) → Deve retornar 404 (normal, não há rota na raiz)

---

### Passo 4: Verificar Rotas Disponíveis

O NestJS não tem uma rota GET na raiz `/api`. As rotas disponíveis são:

- `POST /api/auth/login` - Login
- `GET /api/users` - Listar usuários
- `GET /api/leads` - Listar leads
- etc.

**O erro 404 em `/api` é NORMAL** se não houver rota GET configurada na raiz.

---

## ✅ Testes Corretos

### Teste 1: Rota de Login (POST)

```bash
curl -X POST http://localhost:21008/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@exemplo.com","senha":"sua_senha"}'
```

**Resultado esperado:**
- ✅ Se credenciais corretas: `{"access_token":"...","user":{...}}`
- ✅ Se credenciais incorretas: `{"statusCode":401,"message":"..."}`

### Teste 2: Verificar se Servidor Está Respondendo

```bash
# Testar qualquer rota (deve retornar erro de autenticação, não 404)
curl http://localhost:21008/api/users
```

**Resultado esperado:**
- ✅ Se não autenticado: `{"statusCode":401,"message":"Unauthorized"}`
- ❌ Se 404: Problema com rotas

---

## 🔧 Soluções

### Solução 1: O Erro 404 em `/api` é Normal

Se você está testando apenas `GET /api`, o erro 404 é **normal** porque não há rota GET na raiz da API.

**Teste uma rota que existe:**
```bash
# Testar login (POST)
curl -X POST http://localhost:21008/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@exemplo.com","senha":"sua_senha"}'
```

### Solução 2: Verificar se Rotas Estão Mapeadas

Verifique nos logs se as rotas foram mapeadas:

**Logs devem mostrar:**
```
[RouterExplorer] Mapped {/api/auth/login, POST} route
[RouterExplorer] Mapped {/api/users, GET} route
[RouterExplorer] Mapped {/api/leads, GET} route
...
```

Se não aparecer, há problema na inicialização.

### Solução 3: Verificar Código Compilado

```bash
# Verificar se dist/main.js existe
ls -la /home/crmcc/apps_nodejs/crm/dist/main.js

# Verificar conteúdo (deve ter código compilado)
head -20 /home/crmcc/apps_nodejs/crm/dist/main.js
```

### Solução 4: Reiniciar Aplicação

1. No painel da KingHost, **pare** a aplicação
2. Aguarde 5 segundos
3. **Inicie** novamente
4. Verifique os logs

---

## 🎯 Teste Completo

Execute este script completo para diagnosticar:

```bash
# Conectar
ssh crmcc@nodejsnglf02

# 1. Verificar se está rodando
echo "=== Processos Node.js ==="
ps aux | grep node | grep -v grep

# 2. Verificar porta
echo "=== Porta 21008 ==="
netstat -tulpn | grep :21008

# 3. Testar rota de login
echo "=== Teste Login ==="
curl -X POST http://localhost:21008/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste","senha":"teste"}' \
  -v

# 4. Testar rota de usuários (deve dar 401, não 404)
echo "=== Teste Usuários ==="
curl http://localhost:21008/api/users -v

# 5. Verificar arquivos
echo "=== Arquivos ==="
cd /home/crmcc/apps_nodejs/crm/
ls -la dist/main.js
```

---

## 📋 Interpretação dos Resultados

### ✅ Se Login Funcionar (mesmo com erro de credenciais)

- ✅ Aplicação está rodando corretamente
- ✅ Rotas estão mapeadas
- ✅ O problema é apenas que `/api` (GET) não existe (normal)

### ❌ Se Login Retornar 404

- ❌ Rotas não estão mapeadas
- ❌ Problema na inicialização do NestJS
- ❌ Verificar logs da aplicação

### ❌ Se Nada Responder

- ❌ Aplicação não está rodando
- ❌ Porta incorreta
- ❌ Verificar configuração no painel

---

## 💡 Importante

**O erro 404 em `GET /api` é NORMAL!**

O NestJS não tem uma rota GET na raiz `/api`. As rotas disponíveis são:
- `POST /api/auth/login`
- `GET /api/users`
- `GET /api/leads`
- etc.

**Para testar se está funcionando, use uma rota que existe:**

```bash
# ✅ CORRETO - Testar login
curl -X POST http://localhost:21008/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@exemplo.com","senha":"sua_senha"}'

# ✅ CORRETO - Testar usuários (deve dar 401, não 404)
curl http://localhost:21008/api/users
```

---

## 🎯 Próximos Passos

1. **Teste a rota de login** (POST) ao invés de GET /api
2. **Verifique os logs** para ver se as rotas foram mapeadas
3. **Se login funcionar**, o problema é apenas que você está testando uma rota que não existe
4. **Configure o frontend** para usar a URL correta

---

## ✅ Resumo

- ❌ `GET /api` → 404 (normal, não existe essa rota)
- ✅ `POST /api/auth/login` → Deve funcionar
- ✅ `GET /api/users` → Deve retornar 401 (não autenticado) ou 200 (se autenticado)

**Teste as rotas que realmente existem!**







