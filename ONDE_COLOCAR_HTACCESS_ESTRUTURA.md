# 📍 Onde Colocar .htaccess - Estrutura KingHost

## 📂 Estrutura Identificada

Baseado na estrutura mostrada:

```
/apps_nodejs/crm/
├── dist/                    ← Backend compilado
├── frontend/
│   └── dist/                ← Frontend compilado (index.html aqui)
└── ...

/www/                        ← Diretório web público do Apache
└── assets/                  ← Assets estáticos
```

## ✅ Onde Colocar o .htaccess

### **OPÇÃO 1: Se o Apache serve de `/www/` (Mais Provável)**

Se o Apache está configurado para servir arquivos de `/www/`, então:

**Localização:** `/www/.htaccess`

**Estrutura esperada:**
```
/www/
├── .htaccess             ← AQUI
├── index.html            ← Deve estar aqui também
└── assets/               ← Assets
```

**Ação necessária:**
1. Copiar `index.html` de `/apps_nodejs/crm/frontend/dist/` para `/www/`
2. Copiar pasta `assets/` de `/apps_nodejs/crm/frontend/dist/` para `/www/`
3. Criar `.htaccess` em `/www/`

---

### **OPÇÃO 2: Se o NestJS serve o frontend diretamente**

Se o NestJS está servindo o frontend de `/apps_nodejs/crm/frontend/dist/`, então:

**O `.htaccess` não é necessário** porque o Apache não está servindo o frontend.

**Mas você ainda precisa de proxy reverso!**

Nesse caso, você precisa configurar o Apache para fazer proxy reverso de **TUDO** para a porta 21008, não apenas `/api`.

**Isso requer configuração no Apache (arquivo .conf), não apenas .htaccess.**

---

## 🔍 Como Descobrir Qual Opção Usar

### Teste 1: Verificar onde o Apache serve

```bash
# Verificar configuração do Apache
apachectl -S | grep DocumentRoot
```

**Se mostrar `/www` ou `/home/crmcc/www`:**
- ✅ Use **OPÇÃO 1**
- Coloque `.htaccess` em `/www/`
- Copie arquivos do frontend para `/www/`

**Se mostrar outro caminho:**
- Verifique se é `/apps_nodejs/crm/frontend/dist/` ou similar
- Se for, use **OPÇÃO 2** (mas precisará de configuração do Apache)

---

### Teste 2: Verificar onde está o index.html acessível

**No navegador, acesse:**
```
https://www.crmcc.kinghost.net/
```

**Se carregar o frontend:**
- O Apache está servindo de algum lugar
- Descubra qual diretório (via `apachectl -S`)

**Se não carregar ou der erro:**
- O NestJS pode estar servindo o frontend
- Verifique logs: `pm2 logs crm`

---

## 🎯 Solução Recomendada

### **Cenário Mais Provável: Apache serve de `/www/`**

#### Passo 1: Verificar estrutura atual

```bash
# Verificar se /www/ existe e tem arquivos
ls -la /www/

# Verificar se index.html está em /www/
ls -la /www/index.html
```

#### Passo 2: Se index.html NÃO estiver em /www/

**Copiar arquivos do frontend para /www/:**

```bash
# Copiar index.html
cp /apps_nodejs/crm/frontend/dist/index.html /www/

# Copiar pasta assets (se não existir)
cp -r /apps_nodejs/crm/frontend/dist/assets /www/

# Verificar
ls -la /www/
```

#### Passo 3: Criar .htaccess em /www/

```bash
cd /www
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

#### Passo 4: Verificar permissões

```bash
ls -la /www/.htaccess
chmod 644 /www/.htaccess
```

---

## 🔄 Alternativa: Usar Estrutura Atual

Se você preferir **não copiar arquivos** e manter tudo em `/apps_nodejs/crm/frontend/dist/`:

### Opção: Configurar Apache para servir de `/apps_nodejs/crm/frontend/dist/`

**Isso requer acesso root ou suporte KingHost:**

1. Configurar VirtualHost do Apache para apontar `DocumentRoot` para `/apps_nodejs/crm/frontend/dist/`
2. Colocar `.htaccess` em `/apps_nodejs/crm/frontend/dist/`

**Mas isso requer permissões que você não tem.**

---

## ✅ Checklist

- [ ] Verificar onde Apache serve: `apachectl -S | grep DocumentRoot`
- [ ] Se for `/www/`: Copiar arquivos do frontend para `/www/`
- [ ] Criar `.htaccess` no diretório web público
- [ ] Verificar se `.htaccess` existe: `ls -la /www/.htaccess`
- [ ] Testar proxy: `curl http://localhost/api/`
- [ ] Testar no navegador: `https://www.crmcc.kinghost.net/api/`

---

## 📋 Resumo

**Baseado na estrutura mostrada:**

1. **Se Apache serve de `/www/`:** 
   - ✅ Coloque `.htaccess` em `/www/`
   - ✅ Copie `index.html` e `assets/` para `/www/`

2. **Se NestJS serve tudo:**
   - ❌ `.htaccess` não ajuda (Apache não serve frontend)
   - ⚠️ Precisa configurar proxy reverso no Apache (requer suporte)

3. **Verificar primeiro:**
   ```bash
   apachectl -S | grep DocumentRoot
   ```

---

**Pronto!** 🎉 Verifique onde o Apache serve e coloque o `.htaccess` lá.


