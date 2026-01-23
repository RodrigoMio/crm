# 🔧 Solução: ERR_CONNECTION_TIMED_OUT na KingHost

## ❌ Problema

O backend está rodando corretamente na porta **21008**, mas o frontend não consegue se conectar porque:
- O frontend tenta acessar `https://www.crmcc.kinghost.net/api/login`
- Mas o Apache/Nginx da KingHost não está configurado para fazer proxy reverso
- As requisições `/api` não estão sendo redirecionadas para `http://localhost:21008/api`

## ✅ Solução: Configurar Proxy Reverso

Na KingHost, você precisa configurar o Apache/Nginx para redirecionar requisições `/api` para o backend Node.js.

### **OPÇÃO 1: Usar arquivo .htaccess (Recomendado - Mais Fácil)**

#### Passo 1: Verificar onde o Apache serve os arquivos

Na KingHost, o Apache geralmente serve arquivos de:
- `/www` ou `/home/crmcc/www`
- Ou o diretório configurado no painel da KingHost

**Verificar via SSH:**
```bash
# Verificar configuração do Apache
cat /etc/httpd/conf/httpd.conf | grep DocumentRoot
# ou
cat /etc/apache2/sites-enabled/* | grep DocumentRoot
```

#### Passo 2: Fazer upload do arquivo .htaccess

**Localização:** O arquivo `.htaccess` deve estar na **raiz do diretório web público** (onde o Apache serve os arquivos).

**Estrutura esperada:**
```
/www/  (ou /home/crmcc/www/)
├── .htaccess          ← AQUI (na raiz)
├── index.html
└── assets/
    ├── index-*.css
    └── index-*.js
```

**Conteúdo do `.htaccess`:**
```apache
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
  
  # Não reescrever arquivos existentes
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # Não reescrever requisições para /api (já tratadas pelo proxy acima)
  RewriteCond %{REQUEST_URI} !^/api
  
  # Redirecionar todas as rotas para index.html (SPA)
  RewriteRule . /index.html [L]
</IfModule>
```

#### Passo 3: Verificar se mod_proxy está habilitado

```bash
# Verificar módulos do Apache
apache2ctl -M | grep proxy
# ou
httpd -M | grep proxy
```

**Se não estiver habilitado, habilitar:**
```bash
# Ubuntu/Debian
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo systemctl restart apache2

# CentOS/RHEL
# Editar /etc/httpd/conf/httpd.conf e descomentar:
# LoadModule proxy_module modules/mod_proxy.so
# LoadModule proxy_http_module modules/mod_proxy_http.so
sudo systemctl restart httpd
```

---

### **OPÇÃO 2: Configurar no Painel KingHost**

Alguns planos da KingHost permitem configurar proxy reverso pelo painel:

1. Acesse o **Painel KingHost**
2. Vá em **Configurações** → **Apache/Nginx** → **Proxy Reverso**
3. Adicione a regra:
   - **Caminho:** `/api`
   - **Destino:** `http://localhost:21008/api`
   - **Tipo:** Proxy Reverso

---

### **OPÇÃO 3: Configurar Virtual Host do Apache (Avançado)**

Se você tem acesso root ou sudo, pode configurar diretamente no Apache:

**Editar arquivo de configuração do site:**
```bash
# Localização comum:
# /etc/apache2/sites-available/000-default.conf
# ou
# /etc/httpd/conf.d/vhost.conf

# Adicionar dentro do <VirtualHost>:
<VirtualHost *:80>
    ServerName www.crmcc.kinghost.net
    
    # Proxy reverso para API
    ProxyPass /api http://localhost:21008/api
    ProxyPassReverse /api http://localhost:21008/api
    
    # Diretório web
    DocumentRoot /www
    <Directory /www>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

**Reiniciar Apache:**
```bash
sudo systemctl restart apache2
# ou
sudo systemctl restart httpd
```

---

### **OPÇÃO 4: Servir Frontend pelo NestJS (Alternativa)**

Se não conseguir configurar o proxy reverso, você pode servir o frontend diretamente pelo NestJS (que já está configurado).

**Vantagem:** Não precisa configurar Apache/Nginx  
**Desvantagem:** Frontend e backend na mesma porta (pode ter limitações)

**Como funciona:**
- O NestJS já está configurado para servir o frontend de `frontend/dist/`
- Acesse diretamente: `http://www.crmcc.kinghost.net:21008/`
- Mas isso requer que a porta 21008 seja acessível externamente (pode não funcionar na KingHost)

---

## 🔍 Verificação

### 1. Testar Proxy Reverso

**Via SSH:**
```bash
# Testar se o proxy está funcionando
curl -I http://localhost/api/auth/login
# Deve retornar status HTTP (não timeout)
```

**Via Navegador:**
- Acesse: `https://www.crmcc.kinghost.net/api/`
- Deve retornar 404 (normal, pois não há rota na raiz da API)
- **NÃO deve dar timeout!**

### 2. Verificar Logs do Apache

```bash
# Ver logs de erro do Apache
tail -f /var/log/apache2/error.log
# ou
tail -f /var/log/httpd/error_log

# Ver logs de acesso
tail -f /var/log/apache2/access.log
# ou
tail -f /var/log/httpd/access_log
```

### 3. Testar Frontend

1. Acesse: `https://www.crmcc.kinghost.net/`
2. Tente fazer login
3. Abra o **DevTools** → **Network**
4. Verifique se a requisição `/api/auth/login` retorna **200 OK** (não timeout)

---

## 🚨 Troubleshooting

### Problema 1: "mod_proxy não encontrado"

**Solução:**
```bash
# Habilitar módulos
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo systemctl restart apache2
```

### Problema 2: "403 Forbidden" no proxy

**Solução:** Adicionar no `.htaccess` ou configuração do Apache:
```apache
<IfModule mod_proxy.c>
  ProxyPass /api http://localhost:21008/api
  ProxyPassReverse /api http://localhost:21008/api
  ProxyPreserveHost On
  ProxyRequests Off
</IfModule>
```

### Problema 3: "502 Bad Gateway"

**Causa:** Backend não está rodando ou porta incorreta.

**Solução:**
```bash
# Verificar se backend está rodando
pm2 status
pm2 logs crm

# Verificar porta
netstat -tulpn | grep 21008
```

### Problema 4: Frontend funciona mas API não

**Causa:** `.htaccess` não está no lugar certo ou Apache não está lendo.

**Solução:**
```bash
# Verificar se .htaccess existe
ls -la /www/.htaccess

# Verificar permissões
chmod 644 /www/.htaccess

# Verificar se AllowOverride está habilitado no Apache
grep -r "AllowOverride" /etc/apache2/sites-enabled/
```

---

## 📝 Resumo Rápido

1. **Fazer upload do `.htaccess`** para a raiz do diretório web (`/www/` ou similar)
2. **Habilitar mod_proxy** no Apache (se necessário)
3. **Reiniciar Apache**: `sudo systemctl restart apache2`
4. **Testar**: Acessar `https://www.crmcc.kinghost.net/api/` (deve retornar 404, não timeout)
5. **Testar login** no frontend

---

## 💡 Dica Final

Se você não tem acesso root/sudo na KingHost, entre em contato com o suporte e peça para:
- Habilitar `mod_proxy` e `mod_proxy_http` no Apache
- Configurar proxy reverso de `/api` para `http://localhost:21008/api`

**Ou** use a **OPÇÃO 1** (arquivo `.htaccess`) que geralmente funciona sem precisar de acesso root.

---

**Pronto!** 🎉 Após configurar o proxy reverso, o frontend conseguirá se conectar ao backend.





