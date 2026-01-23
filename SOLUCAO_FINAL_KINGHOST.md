# 🔧 Solução Final: KingHost sem Permissão Root

## ❌ Situação Confirmada

- ✅ Backend rodando na porta 21008 (interno)
- ❌ Porta 21008 **NÃO é acessível externamente** (timeout)
- ❌ Sem permissão para criar arquivos em `/etc/httpd/conf.d/`
- ❌ Sem permissão para configurar proxy reverso via arquivos de sistema

## ✅ Soluções Disponíveis

### **OPÇÃO 1: Criar .htaccess no Diretório Web (Recomendado)**

Mesmo sem permissão root, você **pode ter permissão** para criar arquivos no diretório web público (onde o Apache serve os arquivos).

#### Passo 1: Descobrir onde o Apache serve os arquivos

**Via SSH:**
```bash
# Verificar configuração do VirtualHost
apachectl -S | grep DocumentRoot
# ou
grep -r "DocumentRoot" /etc/httpd/conf.d/ 2>/dev/null
```

**Locais comuns na KingHost:**
- `/www`
- `/home/crmcc/www`
- `/var/www/html`
- `/home/crmcc/public_html`

#### Passo 2: Verificar se você tem permissão de escrita

```bash
# Testar se pode criar arquivo
touch /www/test.txt
# ou
touch /home/crmcc/www/test.txt

# Se funcionar, você tem permissão! ✅
# Se der "Permission denied", você não tem permissão ❌
```

#### Passo 3: Criar arquivo .htaccess

**Se tiver permissão:**
```bash
# Navegar para o diretório web
cd /www  # ou /home/crmcc/www (conforme o resultado do Passo 1)

# Criar arquivo .htaccess
nano .htaccess
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

**Salvar:** `Ctrl + X`, depois `Y`, depois `Enter`

#### Passo 4: Verificar se AllowOverride está habilitado

O Apache precisa ter `AllowOverride All` no diretório web para ler o `.htaccess`.

**Se o `.htaccess` não funcionar**, pode ser que `AllowOverride` esteja desabilitado. Nesse caso, use a **OPÇÃO 2**.

---

### **OPÇÃO 2: Contatar Suporte KingHost (Mais Confiável)**

Se você não tem permissão para criar `.htaccess` ou se `AllowOverride` estiver desabilitado, contate o suporte da KingHost.

**Mensagem para o suporte:**

```
Olá, preciso configurar um proxy reverso no Apache para minha aplicação Node.js.

Situação:
- Tenho uma aplicação Node.js rodando na porta 21008 (via PM2)
- O frontend React precisa acessar a API através de requisições /api
- A porta 21008 não é acessível externamente (é apenas interna)

Necessidade:
Preciso que o Apache faça proxy reverso, redirecionando todas as requisições 
para /api para http://localhost:21008/api

Não tenho permissão root para criar arquivos em /etc/httpd/conf.d/

Pode me ajudar a configurar isso? Posso fornecer mais detalhes se necessário.

Obrigado!
```

**Informações adicionais que podem ajudar:**
- Domínio: `www.crmcc.kinghost.net`
- Porta do backend: `21008`
- Caminho do backend: `/home/crmcc/apps_nodejs/crm/`
- Backend está rodando via PM2

---

### **OPÇÃO 3: Usar Variável de Ambiente (Temporário - Não Recomendado)**

Se você conseguir descobrir uma URL alternativa ou se a KingHost fornecer uma URL específica para a API, pode configurar via variável de ambiente.

**Criar arquivo `.env` no frontend (local):**
```bash
cd frontend
nano .env
```

**Conteúdo:**
```env
# URL da API (fornecida pelo suporte KingHost ou alternativa)
VITE_API_URL=https://api.crmcc.kinghost.net
# ou
VITE_API_URL=https://www.crmcc.kinghost.net/api
```

**Recompilar:**
```powershell
cd frontend
npm run build
```

**Fazer upload do `frontend/dist/` atualizado**

**⚠️ Nota:** Isso só funcionará se houver uma forma de acessar a API externamente, o que provavelmente não existe sem proxy reverso.

---

## 🔍 Verificação Passo a Passo

### 1. Verificar permissões no diretório web

```bash
# Tentar descobrir onde o Apache serve os arquivos
apachectl -S

# Tentar criar arquivo de teste
touch /www/test.txt
# ou
touch /home/crmcc/www/test.txt
```

### 2. Se tiver permissão: Criar .htaccess

```bash
cd /www  # ou o diretório encontrado
nano .htaccess
# Colar conteúdo do .htaccess acima
```

### 3. Testar proxy reverso

```bash
# Via curl (SSH)
curl -I http://localhost/api/

# Via navegador
https://www.crmcc.kinghost.net/api/
```

**Resultado esperado:**
- ✅ **404 Not Found**: Proxy está funcionando! (404 é normal, pois não há rota na raiz da API)
- ❌ **Timeout**: Proxy não está funcionando, verificar logs ou contatar suporte

### 4. Verificar logs do Apache

```bash
# Ver logs de erro
tail -f /var/log/httpd/error_log

# Ver logs de acesso
tail -f /var/log/httpd/access_log
```

---

## 📋 Checklist Final

- [ ] Descobrir onde o Apache serve os arquivos (`apachectl -S`)
- [ ] Verificar se tem permissão para criar arquivos no diretório web
- [ ] Se tiver permissão: Criar `.htaccess` com configuração de proxy
- [ ] Se não tiver permissão: Contatar suporte KingHost
- [ ] Testar: `https://www.crmcc.kinghost.net/api/` (deve retornar 404, não timeout)
- [ ] Testar login no frontend
- [ ] Verificar logs do backend: `pm2 logs crm`

---

## 💡 Recomendação Final

**Ordem de tentativa:**

1. **Primeiro:** Tentar criar `.htaccess` no diretório web (OPÇÃO 1)
2. **Se não funcionar:** Contatar suporte KingHost (OPÇÃO 2)
3. **Enquanto aguarda suporte:** Verificar se há outras formas de acesso à API

---

## 🚨 Problemas Comuns

### Problema: "Permission denied" ao criar .htaccess

**Solução:** Você não tem permissão. Use OPÇÃO 2 (contatar suporte).

### Problema: .htaccess criado mas não funciona

**Causas possíveis:**
- `AllowOverride` está desabilitado no Apache
- `mod_proxy` não está habilitado
- Arquivo está no lugar errado

**Solução:** Verificar logs do Apache ou contatar suporte.

### Problema: Suporte não responde ou demora

**Solução temporária:** 
- Verificar se há painel da KingHost com opção de configurar proxy reverso
- Verificar documentação da KingHost sobre aplicações Node.js

---

**Pronto!** 🎉 Siga a ordem recomendada e você conseguirá configurar o proxy reverso.





