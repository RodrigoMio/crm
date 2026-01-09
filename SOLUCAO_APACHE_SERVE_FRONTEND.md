# 🔧 Solução - Apache Servir Frontend (Sem Porta)

## 🔍 DIAGNÓSTICO

**Situação:**
- ✅ Funciona em: `http://www.crmcc.kinghost.net:21008/` (backend Node.js)
- ❌ Não funciona em: `http://www.crmcc.kinghost.net/` (Apache porta 80)

**Problema:** O Apache (porta 80) não tem os arquivos do frontend ou não está configurado corretamente.

---

## ✅ SOLUÇÃO: Copiar Frontend para `/www/`

O Apache serve arquivos de `/www/`. Você precisa copiar os arquivos do frontend para lá.

### Passo 1: Verificar Estrutura Atual

Via SSH:

```bash
# Verificar onde estão os arquivos do frontend
ls -la /apps_nodejs/crm/frontend/dist/

# Verificar o que tem em /www/
ls -la /www/
```

### Passo 2: Copiar Arquivos para `/www/`

```bash
# Copiar todos os arquivos do frontend para /www/
cp -r /apps_nodejs/crm/frontend/dist/* /www/

# OU se preferir mover (remove da origem)
# mv /apps_nodejs/crm/frontend/dist/* /www/
```

**Estrutura esperada em `/www/`:**
```
/www/
├── index.html
├── .htaccess
└── assets/
    ├── index-42d5d3d6.js
    └── index-7f873524.css
```

### Passo 3: Verificar `.htaccess` em `/www/`

Certifique-se de que o arquivo `.htaccess` está em `/www/`:

```bash
# Verificar se .htaccess existe
ls -la /www/.htaccess

# Se não existir, copie
cp /apps_nodejs/crm/frontend/.htaccess /www/.htaccess
```

**OU crie/edite `/www/.htaccess` com:**

```apache
# Configuração Apache para SPA (Single Page Application)

# PROXY REVERSO PARA API - DEVE VIR ANTES DAS REGRAS DE SPA
# Redireciona requisições /api para o backend Node.js na porta 21008
<IfModule mod_proxy.c>
  ProxyPass /api http://localhost:21008/api
  ProxyPassReverse /api http://localhost:21008/api
  ProxyPreserveHost On
</IfModule>

# Se mod_proxy não estiver disponível, use mod_rewrite como alternativa
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Proxy reverso para API usando RewriteRule (se mod_proxy não funcionar)
  RewriteCond %{REQUEST_URI} ^/api
  RewriteRule ^api/(.*)$ http://localhost:21008/api/$1 [P,L]
  
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
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>

# Compressão GZIP
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript
</IfModule>

# Segurança
Options -Indexes
```

### Passo 4: Verificar Permissões

```bash
# Dar permissões corretas
chmod 644 /www/index.html
chmod 644 /www/.htaccess
chmod -R 755 /www/assets/
chmod 644 /www/assets/*
```

### Passo 5: Testar

1. **Acesse:** `http://www.crmcc.kinghost.net/` (sem porta)
2. **Verifique no DevTools (Network):**
   - `index.html` deve carregar ✅
   - `assets/index-*.js` deve carregar ✅
   - `assets/index-*.css` deve carregar ✅
   - Requisições `/api/*` devem ir para o backend ✅

---

## 🔍 VERIFICAÇÃO

### Verificar se Arquivos Existem

```bash
# Verificar estrutura
ls -la /www/
ls -la /www/assets/

# Verificar se os arquivos específicos existem
ls -la /www/assets/index-*.js
ls -la /www/assets/index-*.css
```

### Verificar Proxy Reverso

Teste se o proxy está funcionando:

```bash
# Testar API via Apache (porta 80)
curl http://localhost/api

# Deve retornar algo do backend (não 404)
```

### Verificar Logs do Apache (se tiver acesso)

```bash
# Ver logs de erro do Apache
tail -f /var/log/apache2/error.log

# Ou
tail -f /var/log/httpd/error_log
```

---

## 🐛 SE AINDA NÃO FUNCIONAR

### Problema: mod_proxy não está habilitado

Se o `ProxyPass` não funcionar, use apenas `mod_rewrite`:

**Edite `/www/.htaccess` e remova/comente a seção `mod_proxy`:**

```apache
# Comentar ou remover esta seção:
# <IfModule mod_proxy.c>
#   ProxyPass /api http://localhost:21008/api
#   ProxyPassReverse /api http://localhost:21008/api
#   ProxyPreserveHost On
# </IfModule>

# Descomentar esta seção:
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Proxy reverso para API
  RewriteCond %{REQUEST_URI} ^/api
  RewriteRule ^api/(.*)$ http://localhost:21008/api/$1 [P,L]
  
  # Resto das regras...
</IfModule>
```

### Problema: Arquivos não aparecem

Verifique se os arquivos foram copiados corretamente:

```bash
# Verificar se index.html existe
cat /www/index.html | head -20

# Verificar se assets existe
ls -la /www/assets/
```

### Problema: Permissões

```bash
# Corrigir permissões
chown -R crmcc:crmcc /www/
chmod -R 755 /www/
chmod 644 /www/index.html
chmod 644 /www/.htaccess
```

---

## 📋 CHECKLIST

- [ ] Arquivos do frontend copiados para `/www/`
- [ ] Arquivo `.htaccess` está em `/www/`
- [ ] `.htaccess` tem configuração de proxy reverso para `/api`
- [ ] Permissões corretas (644 para arquivos, 755 para pastas)
- [ ] Testou acesso sem porta: `http://www.crmcc.kinghost.net/`
- [ ] Assets carregam corretamente (verificar DevTools)
- [ ] API funciona via proxy (requisições `/api/*` funcionam)

---

## 💡 ESTRUTURA FINAL

```
/www/                          ← Apache serve daqui (porta 80)
├── index.html                 ✅
├── .htaccess                  ✅ (com proxy reverso)
└── assets/                    ✅
    ├── index-42d5d3d6.js      ✅
    └── index-7f873524.css    ✅

/apps_nodejs/crm/              ← Backend Node.js (porta 21008)
├── server.js
├── dist/
└── frontend/dist/             (pode manter como backup)
```

---

## 🎯 RESUMO

**O que fazer:**
1. Copiar arquivos de `/apps_nodejs/crm/frontend/dist/*` para `/www/`
2. Garantir que `.htaccess` está em `/www/` com proxy reverso
3. Testar acesso sem porta

**Resultado esperado:**
- `http://www.crmcc.kinghost.net/` → Apache serve frontend ✅
- `http://www.crmcc.kinghost.net/api/*` → Apache faz proxy para backend ✅
- `http://www.crmcc.kinghost.net:21008/` → Backend serve diretamente ✅



