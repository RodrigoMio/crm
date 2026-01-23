# 🔧 Corrigir Frontend: Remover Porta 21008 da URL da API

## ❌ Problema Identificado

O frontend está tentando acessar a API usando a porta 21008 diretamente:
```
http://www.crmcc.kinghost.net:21008/api/auth/login
```

Isso causa `ERR_CONNECTION_TIMED_OUT` porque a porta 21008 **não é acessível externamente**.

## ✅ Solução

O frontend deve usar apenas `/api` (sem porta), e o Apache fará o proxy reverso para `http://localhost:21008/api`.

---

## 📋 Passos para Corrigir

### **PASSO 1: Verificar se o .htaccess está no lugar correto**

**Via SSH:**

```bash
# Verificar se o .htaccess existe em /www/
ls -la /www/.htaccess

# Ver conteúdo
cat /www/.htaccess | grep -i proxy
```

**Deve conter:**
```apache
ProxyPass /api http://localhost:21008/api
ProxyPassReverse /api http://localhost:21008/api
```

**Se não existir ou estiver incorreto:**

```bash
# Criar/editar o .htaccess
nano /www/.htaccess
```

**Cole este conteúdo completo:**

```apache
# PROXY REVERSO PARA API - DEVE VIR ANTES DAS REGRAS DE SPA
# Redireciona requisições /api para o backend Node.js na porta 21008
<IfModule mod_proxy.c>
  ProxyPass /api http://localhost:21008/api
  ProxyPassReverse /api http://localhost:21008/api
  ProxyPreserveHost On
  ProxyRequests Off
</IfModule>

# SPA (Single Page Application) - React Router
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Não reescrever arquivos existentes
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # Não reescrever requisições para /api (já tratadas pelo proxy acima)
  RewriteCond %{REQUEST_URI} !^/api
  
  # Redirecionar todas as rotas para index.html (SPA)
  RewriteRule . /index.html [L]
</IfModule>

# Configurações de cache para assets estáticos
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

**Salvar:** `Ctrl + X`, depois `Y`, depois `Enter`

---

### **PASSO 2: Recompilar o Frontend SEM a porta 21008**

O frontend foi compilado com `VITE_API_URL` definido com a porta 21008. Precisamos recompilar sem isso.

#### **Opção A: Recompilar sem VITE_API_URL (Recomendado)**

**Na sua máquina local:**

```powershell
# Navegar para o frontend
cd frontend

# Verificar se existe arquivo .env
ls .env

# Se existir, verificar conteúdo
cat .env
```

**Se o arquivo `.env` contiver `VITE_API_URL` com a porta 21008:**

```powershell
# Editar o arquivo .env
# Remova ou comente a linha VITE_API_URL
# Ou defina sem porta:
# VITE_API_URL=http://www.crmcc.kinghost.net
```

**Ou simplesmente remova/renomeie o arquivo `.env` temporariamente:**

```powershell
# Renomear para backup
mv .env .env.backup
```

**Agora recompile:**

```powershell
# Limpar build anterior
rm -rf dist

# Recompilar
npm run build
```

**O frontend será compilado usando apenas `/api` (sem porta), que é o correto!**

---

#### **Opção B: Definir VITE_API_URL sem porta**

**Criar/editar `frontend/.env`:**

```env
# URL da API SEM PORTA (usa proxy reverso)
VITE_API_URL=http://www.crmcc.kinghost.net
```

**Recompilar:**

```powershell
cd frontend
npm run build
```

---

### **PASSO 3: Fazer Upload do Frontend Recompilado**

**Na sua máquina local:**

```powershell
# O conteúdo de frontend/dist/ deve ser enviado para /www/ na KingHost
```

**Via FTP/SFTP ou SSH:**

```bash
# Fazer upload do conteúdo de frontend/dist/ para /www/
# Certifique-se de incluir:
# - index.html
# - assets/
# - .htaccess (já deve estar lá do Passo 1)
```

---

### **PASSO 4: Verificar se o Proxy Reverso Está Funcionando**

**Via SSH:**

```bash
# Testar se o proxy está funcionando
curl http://localhost/api/

# Deve retornar algo (mesmo que 404), não timeout
```

**No navegador:**

```
http://www.crmcc.kinghost.net/api/
```

**Deve retornar 404 (não timeout) - isso confirma que o proxy está funcionando!**

---

## 🔍 Verificação Final

### 1. Verificar URL da API no Frontend

**No navegador, abra o DevTools (F12) → Network:**

1. Tente fazer login
2. Veja a requisição para `/api/auth/login`
3. **A URL deve ser:** `http://www.crmcc.kinghost.net/api/auth/login`
4. **NÃO deve ter:** `:21008` na URL

### 2. Verificar se o Proxy Está Funcionando

**Se a URL estiver correta (sem porta) mas ainda der timeout:**

```bash
# Verificar se mod_proxy está habilitado
httpd -M | grep proxy

# Verificar logs do Apache
tail -f /var/log/httpd/error_log
```

---

## 🚨 Troubleshooting

### Problema: Frontend ainda usa porta 21008 após recompilar

**Solução:**
1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Verifique se o arquivo `.env` não tem `VITE_API_URL` com porta
3. Verifique se o build foi feito corretamente: `cat dist/assets/index-*.js | grep 21008`

### Problema: Proxy não funciona (mod_proxy não habilitado)

**Solução:**
1. Contatar suporte da KingHost para habilitar `mod_proxy`
2. Ou usar apenas `mod_rewrite` (veja alternativa abaixo)

### Problema: AllowOverride não está habilitado

**Solução:**
Se o `.htaccess` não está sendo lido, você precisa:
1. Contatar suporte da KingHost para habilitar `AllowOverride All`
2. Ou criar arquivo `.conf` em `/etc/httpd/conf.d/` (requer root)

---

## ✅ Checklist

- [ ] `.htaccess` existe em `/www/` com configuração de proxy
- [ ] Frontend recompilado SEM `VITE_API_URL` com porta 21008
- [ ] Upload do frontend recompilado feito para `/www/`
- [ ] Teste do proxy: `curl http://localhost/api/` retorna algo (não timeout)
- [ ] No navegador, requisições da API não têm `:21008` na URL
- [ ] Login funciona corretamente

---

## 📝 Resumo

**O problema:** Frontend compilado com porta 21008 na URL da API.

**A solução:**
1. Garantir que `.htaccess` está em `/www/` com proxy reverso
2. Recompilar frontend SEM `VITE_API_URL` com porta (ou sem `VITE_API_URL`)
3. Fazer upload do frontend recompilado
4. Frontend usará `/api` e o Apache fará proxy para `localhost:21008`

**Pronto!** 🎉 Após seguir estes passos, o frontend usará o proxy reverso corretamente.





