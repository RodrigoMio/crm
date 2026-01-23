# 👤 Criar/Atualizar Usuário Admin

## ✅ Boa Notícia!

O erro **401 "Credenciais inválidas"** significa que:
- ✅ A aplicação está funcionando
- ✅ A rota está correta
- ✅ A requisição está chegando ao backend
- ❌ As credenciais estão incorretas ou o usuário não existe

---

## 🔧 Solução: Criar/Atualizar Usuário Admin

### Opção 1: Via Script Node.js (Recomendado)

**Via SSH:**

```bash
# Conectar ao servidor
ssh crmcc@nodejsnglf02

# Navegar até o diretório
cd /home/crmcc/apps_nodejs/crm/

# Executar script para criar/atualizar admin
node dist/scripts/create-admin.js
```

**Credenciais padrão criadas:**
- **Email:** `admin@crm.com`
- **Senha:** `admin123`

---

### Opção 2: Via SQL Direto (Redehost)

Se você tiver acesso ao banco de dados na Redehost:

**1. Acesse o painel da Redehost**
**2. Abra o gerenciador SQL (phpPgAdmin ou similar)**
**3. Execute este SQL:**

```sql
-- Verificar se o usuário existe
SELECT * FROM usuarios WHERE email = 'admin@crm.com';

-- Se não existir, criar (senha: admin123)
-- Hash bcrypt para 'admin123'
INSERT INTO usuarios (nome, email, senha, perfil, ativo, created_at, updated_at)
VALUES (
    'Administrador',
    'admin@crm.com',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'ADMIN',
    TRUE,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Se existir, atualizar senha
UPDATE usuarios 
SET senha = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    ativo = TRUE,
    perfil = 'ADMIN',
    updated_at = NOW()
WHERE email = 'admin@crm.com';
```

---

## 🧪 Testar Login

Após criar/atualizar o usuário, teste:

```bash
curl -X POST http://localhost:21008/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm.com","senha":"admin123"}'
```

**Resultado esperado:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "nome": "Administrador",
    "email": "admin@crm.com",
    "perfil": "ADMIN"
  }
}
```

---

## 🔍 Verificar Usuário no Banco

**Via SSH (se tiver acesso ao banco):**

```bash
# Conectar ao banco PostgreSQL
psql -h pgsql01.redehost.com.br -U seu_usuario -d seu_banco

# Verificar usuários
SELECT id, nome, email, perfil, ativo FROM usuarios;

# Verificar usuário admin específico
SELECT id, nome, email, perfil, ativo FROM usuarios WHERE email = 'admin@crm.com';
```

---

## 📋 Credenciais Padrão

Após executar o script `create-admin`, as credenciais são:

- **Email:** `admin@crm.com`
- **Senha:** `admin123`

⚠️ **IMPORTANTE:** Altere a senha após o primeiro login em produção!

---

## 🔧 Se o Script Não Funcionar

Se `node dist/scripts/create-admin.js` não funcionar, você pode:

**1. Verificar se o arquivo existe:**
```bash
ls -la dist/scripts/create-admin.js
```

**2. Verificar se há erros:**
```bash
node dist/scripts/create-admin.js 2>&1
```

**3. Usar SQL direto** (Opção 2 acima)

---

## ✅ Checklist

- [ ] Executou script `create-admin` ou SQL
- [ ] Verificou se usuário foi criado
- [ ] Testou login com credenciais padrão
- [ ] Login funcionou (retornou token)
- [ ] Testou login no frontend

---

## 🎯 Próximos Passos

Após criar o usuário admin:

1. **Teste o login via curl** (comando acima)
2. **Se funcionar**, teste no frontend
3. **Altere a senha** após o primeiro login
4. **Crie outros usuários** se necessário

---

## 💡 Dica

Se você quiser criar um usuário com senha diferente, pode modificar o script ou usar SQL direto com um hash bcrypt diferente.

Para gerar um hash bcrypt, você pode usar:
- Ferramentas online de hash bcrypt
- Ou criar um script Node.js temporário










