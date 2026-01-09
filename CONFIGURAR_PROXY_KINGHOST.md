# 🔧 Configurar Proxy Reverso na KingHost

## 📍 Situação Atual

Você verificou que:
- ✅ Apache está instalado (`/etc/httpd/` existe)
- ✅ Diretório `conf.d` existe (`/etc/httpd/conf.d/`)
- ❌ `httpd.conf` principal não está no lugar padrão (gerenciado pelo painel)

## ✅ Solução: Criar Arquivo de Configuração em `conf.d`

### **OPÇÃO 1: Criar arquivo .conf em conf.d (Recomendado)**

Crie um novo arquivo de configuração para o proxy reverso:

```bash
# Navegar para o diretório conf.d
cd /etc/httpd/conf.d

# Criar arquivo de configuração do proxy
sudo nano crm-proxy.conf
```

**Conteúdo do arquivo `crm-proxy.conf`:**
```apache
# Proxy Reverso para API do CRM
<IfModule mod_proxy.c>
    ProxyPass /api http://localhost:21008/api
    ProxyPassReverse /api http://localhost:21008/api
    ProxyPreserveHost On
    ProxyRequests Off
</IfModule>
```

**Salvar:** `Ctrl + X`, depois `Y`, depois `Enter`

**Verificar se mod_proxy está habilitado:**
```bash
# Verificar módulos do Apache
httpd -M | grep proxy
```

**Se não estiver habilitado, habilitar:**
```bash
# Verificar se existe arquivo de módulo
ls -la /etc/httpd/modules/mod_proxy.so

# Se existir, criar arquivo de configuração para habilitar
sudo nano /etc/httpd/conf.d/00-proxy.conf
```

**Conteúdo de `00-proxy.conf` (para habilitar módulos):**
```apache
# Habilitar módulos de proxy
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
```

**Reiniciar Apache:**
```bash
sudo systemctl restart httpd
# ou
sudo service httpd restart
```

---

### **OPÇÃO 2: Usar arquivo .htaccess (Mais Simples - Não Requer Root)**

Se você não tem acesso `sudo` ou prefere uma solução mais simples:

#### Passo 1: Descobrir onde o Apache serve os arquivos

```bash
# Verificar configuração do VirtualHost
grep -r "DocumentRoot" /etc/httpd/conf.d/
# ou
apachectl -S | grep DocumentRoot
```

**Locais comuns na KingHost:**
- `/www`
- `/home/crmcc/www`
- `/var/www/html`

#### Passo 2: Fazer upload do arquivo .htaccess

Coloque o arquivo `.htaccess` na **raiz do diretório web** (onde está o `index.html` do frontend).

**Estrutura esperada:**
```
/www/  (ou /home/crmcc/www/)
├── .htaccess          ← AQUI
├── index.html
└── assets/
```

**Conteúdo do `.htaccess`:**
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

#### Passo 3: Verificar se AllowOverride está habilitado

```bash
# Verificar configuração
grep -r "AllowOverride" /etc/httpd/conf.d/
```

**Se não estiver habilitado**, você precisará de acesso root para editar a configuração do VirtualHost.

---

## 🔍 Verificação

### 1. Verificar se o proxy está funcionando

```bash
# Testar localmente
curl -I http://localhost/api/
# Deve retornar status HTTP (não timeout)
```

### 2. Verificar logs do Apache

```bash
# Ver logs de erro
tail -f /var/log/httpd/error_log

# Ver logs de acesso
tail -f /var/log/httpd/access_log
```

### 3. Testar no navegador

- Acesse: `https://www.crmcc.kinghost.net/api/`
- Deve retornar **404** (não timeout) - isso significa que o proxy está funcionando!

---

## 🚨 Troubleshooting

### Problema 1: "mod_proxy não encontrado"

**Verificar:**
```bash
httpd -M | grep proxy
```

**Se não aparecer, verificar se o módulo existe:**
```bash
ls -la /etc/httpd/modules/mod_proxy.so
ls -la /usr/lib64/httpd/modules/mod_proxy.so
ls -la /usr/lib/httpd/modules/mod_proxy.so
```

**Habilitar (se tiver acesso root):**
Criar arquivo `/etc/httpd/conf.d/00-proxy.conf`:
```apache
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
```

### Problema 2: "403 Forbidden" no proxy

**Solução:** Adicionar no arquivo de configuração:
```apache
<IfModule mod_proxy.c>
    ProxyPass /api http://localhost:21008/api
    ProxyPassReverse /api http://localhost:21008/api
    ProxyPreserveHost On
    ProxyRequests Off
    <Proxy *>
        Require all granted
    </Proxy>
</IfModule>
```

### Problema 3: "502 Bad Gateway"

**Causa:** Backend não está rodando ou porta incorreta.

**Verificar:**
```bash
# Verificar se backend está rodando
pm2 status
pm2 logs crm

# Verificar se a porta 21008 está escutando
netstat -tulpn | grep 21008
# ou
ss -tulpn | grep 21008
```

### Problema 4: .htaccess não está funcionando

**Causa:** `AllowOverride` não está habilitado.

**Verificar:**
```bash
grep -r "AllowOverride" /etc/httpd/conf.d/
```

**Se não encontrar ou estiver como `None`, você precisará:**
1. Acesso root para editar configuração
2. Ou usar a **OPÇÃO 1** (arquivo .conf em conf.d)

---

## 📋 Resumo das Opções

| Opção | Requer Root? | Dificuldade | Recomendado |
|-------|--------------|-------------|-------------|
| Arquivo `.conf` em `conf.d` | ✅ Sim | Média | ⭐⭐⭐ |
| Arquivo `.htaccess` | ❌ Não | Fácil | ⭐⭐⭐⭐ |
| Painel KingHost | ❌ Não | Muito Fácil | ⭐⭐⭐⭐⭐ |

---

## 💡 Recomendação Final

1. **Primeiro, tente a OPÇÃO 2** (`.htaccess`) - é mais simples e não requer root
2. Se não funcionar, use a **OPÇÃO 1** (arquivo `.conf` em `conf.d`)
3. Se tiver acesso ao painel KingHost, verifique se há opção de configurar proxy reverso lá

---

## ✅ Checklist

- [ ] Verificar onde o Apache serve os arquivos (`DocumentRoot`)
- [ ] Criar arquivo de configuração (`.conf` ou `.htaccess`)
- [ ] Verificar se `mod_proxy` está habilitado
- [ ] Reiniciar Apache
- [ ] Testar: `curl http://localhost/api/`
- [ ] Testar no navegador: `https://www.crmcc.kinghost.net/api/`
- [ ] Testar login no frontend

---

**Pronto!** 🎉 Após configurar o proxy reverso, o frontend conseguirá se conectar ao backend.


