# 📍 Onde Colocar o Arquivo .htaccess na KingHost

## ✅ Localização Correta

O arquivo `.htaccess` deve estar na **raiz do diretório web público**, no **mesmo nível** que o `index.html` do frontend.

### Estrutura Correta:

```
/home/crmcc/www/          ← Diretório web público (raiz)
├── .htaccess             ← AQUI (mesmo nível que index.html)
├── index.html            ← AQUI
└── assets/               ← AQUI
    ├── index-*.js
    └── index-*.css
```

**OU**

```
/www/                     ← Outro local comum na KingHost
├── .htaccess             ← AQUI
├── index.html            ← AQUI
└── assets/               ← AQUI
```

---

## 🔍 Como Descobrir o Diretório Correto

### Método 1: Via SSH (Recomendado)

```bash
# Verificar configuração do Apache
apachectl -S | grep DocumentRoot
```

**Resultado esperado:**
```
DocumentRoot "/home/crmcc/www"
# ou
DocumentRoot "/www"
```

### Método 2: Verificar onde está o index.html

Se você já fez upload do frontend, o `index.html` está no diretório web público:

```bash
# Procurar index.html
find /home/crmcc -name "index.html" -type f 2>/dev/null
# ou
find /www -name "index.html" -type f 2>/dev/null
```

O diretório onde o `index.html` está é onde o `.htaccess` deve estar!

---

## 📋 Passo a Passo

### 1. Descobrir o diretório web

```bash
apachectl -S | grep DocumentRoot
```

**Anote o caminho** (exemplo: `/home/crmcc/www`)

### 2. Navegar para o diretório

```bash
cd /home/crmcc/www
# ou o caminho que você descobriu
```

### 3. Verificar se index.html está lá

```bash
ls -la index.html
```

**Se existir:** Este é o diretório correto! ✅  
**Se não existir:** Procure em outro lugar ou faça upload do frontend primeiro.

### 4. Criar/Editar .htaccess

```bash
nano .htaccess
```

**Conteúdo:**
```apache
# PROXY REVERSO PARA API
<IfModule mod_proxy.c>
  ProxyPass /api http://localhost:21008/api
  ProxyPassReverse /api http://localhost:21008/api
  ProxyPreserveHost On
</IfModule>

# SPA (React Router)
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_URI} !^/api
  RewriteRule . /index.html [L]
</IfModule>
```

**Salvar:** `Ctrl + X`, depois `Y`, depois `Enter`

### 5. Verificar permissões

```bash
ls -la .htaccess
```

**Resultado esperado:**
```
-rw-r--r-- 1 crmcc crmcc 1234 Jan 15 10:00 .htaccess
```

**Se der "Permission denied" ao criar:**
- Você não tem permissão nesse diretório
- Contate suporte KingHost ou use outro método

---

## ✅ Verificação

### 1. Verificar se arquivo existe

```bash
ls -la /home/crmcc/www/.htaccess
# ou
ls -la /www/.htaccess
```

### 2. Verificar conteúdo

```bash
cat /home/crmcc/www/.htaccess
```

### 3. Testar proxy reverso

```bash
# Via curl (SSH)
curl -I http://localhost/api/

# Via navegador
https://www.crmcc.kinghost.net/api/
```

**Resultado esperado:**
- ✅ **404 Not Found**: Proxy está funcionando! (404 é normal)
- ❌ **Timeout**: Proxy não está funcionando, verificar logs

### 4. Verificar logs do Apache

```bash
tail -f /var/log/httpd/error_log
```

**Se houver erros relacionados a `.htaccess`**, eles aparecerão aqui.

---

## 🚨 Problemas Comuns

### Problema 1: "Permission denied" ao criar .htaccess

**Causa:** Você não tem permissão de escrita no diretório web.

**Solução:**
- Verificar se está no diretório correto
- Tentar com `sudo` (se tiver permissão)
- Contatar suporte KingHost

### Problema 2: .htaccess criado mas não funciona

**Causas possíveis:**
- `AllowOverride` está desabilitado no Apache
- `mod_proxy` não está habilitado
- Arquivo está no lugar errado

**Verificar:**
```bash
# Verificar se AllowOverride está habilitado
grep -r "AllowOverride" /etc/httpd/conf.d/

# Verificar se mod_proxy está habilitado
httpd -M | grep proxy
```

### Problema 3: Não sei qual é o diretório web

**Solução:**
1. Verificar onde está o `index.html` do frontend
2. O `.htaccess` deve estar no mesmo lugar
3. Ou usar `apachectl -S` para descobrir

---

## 📝 Resumo

- **Localização:** Raiz do diretório web público (onde está `index.html`)
- **Caminho comum:** `/home/crmcc/www/` ou `/www/`
- **Como descobrir:** `apachectl -S | grep DocumentRoot`
- **Verificar:** `ls -la /caminho/.htaccess`
- **Testar:** `curl http://localhost/api/` ou navegador

---

## 💡 Dica

Se você já fez upload do frontend, o `.htaccess` deve estar **no mesmo diretório** onde você fez upload do `index.html`.

**Exemplo:**
- Se você fez upload de `index.html` para `/home/crmcc/www/`
- Então o `.htaccess` deve estar em `/home/crmcc/www/.htaccess`

---

**Pronto!** 🎉 O arquivo `.htaccess` deve estar na raiz do diretório web, junto com o `index.html`.


