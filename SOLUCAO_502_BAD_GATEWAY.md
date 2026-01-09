# 🔧 Solução: Erro 502 Bad Gateway

## ❌ Problema

O erro **502 Bad Gateway** do nginx indica que o servidor web (nginx/Apache) está tentando fazer proxy para o backend Node.js, mas o backend não está respondendo ou não está rodando.

---

## 🔍 Diagnóstico Passo a Passo

### 1️⃣ Verificar se o Backend Está Rodando

**Via SSH na KingHost:**

```bash
# Verificar status do PM2
pm2 status

# Verificar logs do backend
pm2 logs crm --lines 50

# Verificar se há processos rodando
pm2 list
```

**Resultado esperado:**
```
┌─────┬────────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name   │ mode        │ ↺       │ status  │ cpu      │
├─────┼────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ crm    │ fork        │ 0       │ online  │ 0%       │
└─────┴────────┴─────────────┴─────────┴─────────┴──────────┘
```

**Se o status for `stopped` ou `errored`:**
- O backend não está rodando ❌
- Veja a solução abaixo

---

### 2️⃣ Verificar se a Porta 21008 Está Escutando

**Via SSH:**

```bash
# Verificar se a porta está em uso
netstat -tulpn | grep 21008
# ou
ss -tulpn | grep 21008
# ou
lsof -i :21008
```

**Resultado esperado:**
```
tcp    0    0 0.0.0.0:21008    0.0.0.0:*    LISTEN    12345/node
```

**Se não aparecer nada:**
- A porta não está sendo usada ❌
- O backend não está rodando ou está em outra porta

---

### 3️⃣ Testar Backend Localmente (No Servidor)

**Via SSH:**

```bash
# Testar se o backend responde localmente
curl http://localhost:21008/api

# Testar endpoint específico
curl http://localhost:21008/api/auth/login
```

**Resultados possíveis:**
- ✅ **200 OK ou 404**: Backend está funcionando!
- ❌ **Connection refused**: Backend não está rodando
- ❌ **Timeout**: Backend está travado ou com erro

---

### 4️⃣ Verificar Logs de Erro do Backend

**Via SSH:**

```bash
# Ver logs completos
pm2 logs crm --lines 100

# Ver apenas erros
pm2 logs crm --err --lines 50

# Ver logs em tempo real
pm2 logs crm
```

**Procure por:**
- Erros de conexão com banco de dados
- Erros de módulos não encontrados
- Erros de porta já em uso
- Erros de arquivo `.env` não encontrado

---

## ✅ Soluções

### **SOLUÇÃO 1: Reiniciar o Backend**

**Via SSH:**

```bash
# Navegar para o diretório do backend
cd /apps_nodejs/crm
# ou
cd /home/crmcc/apps_nodejs/crm

# Parar o backend
pm2 stop crm

# Iniciar o backend
pm2 start server.js --name crm

# Ou reiniciar
pm2 restart crm

# Verificar se iniciou corretamente
pm2 logs crm --lines 20
```

**Verifique se aparece:**
```
🚀 Backend rodando na porta 21008
📡 API disponível em http://localhost:21008/api
```

---

### **SOLUÇÃO 2: Verificar Arquivo .env**

**Via SSH:**

```bash
# Verificar se o arquivo .env existe
ls -la /apps_nodejs/crm/.env

# Ver conteúdo (cuidado: não exponha senhas!)
cat /apps_nodejs/crm/.env | grep -E "PORT|DB_|JWT"
```

**Verifique se contém:**
```env
PORT_SERVER=21008
DB_HOST=...
DB_USERNAME=...
DB_PASSWORD=...
DB_DATABASE=...
JWT_SECRET=...
```

**Se o arquivo não existir ou estiver incompleto:**
- Crie/edite o arquivo `.env` com todas as variáveis necessárias
- Veja o arquivo `ARQUIVO_ENV_COMPLETO.md` para o conteúdo completo

---

### **SOLUÇÃO 3: Verificar Dependências**

**Via SSH:**

```bash
# Navegar para o diretório
cd /apps_nodejs/crm

# Verificar se node_modules existe
ls -la node_modules

# Se não existir ou estiver incompleto, reinstalar
rm -rf node_modules
npm install --production

# Reiniciar backend
pm2 restart crm
```

---

### **SOLUÇÃO 4: Verificar Arquivo server.js e dist/**

**Via SSH:**

```bash
# Verificar se os arquivos existem
ls -la /apps_nodejs/crm/server.js
ls -la /apps_nodejs/crm/dist/main.js

# Se dist/main.js não existir, fazer build
cd /apps_nodejs/crm
npm run build

# Reiniciar backend
pm2 restart crm
```

---

### **SOLUÇÃO 5: Verificar Erros de Compilação**

**Via SSH:**

```bash
# Tentar executar o server.js diretamente para ver erros
cd /apps_nodejs/crm
node server.js
```

**Se aparecer erros:**
- Anote os erros
- Verifique se todas as dependências estão instaladas
- Verifique se o arquivo `.env` está correto
- Verifique se o banco de dados está acessível

**Para parar o teste:**
- Pressione `Ctrl+C`

---

### **SOLUÇÃO 6: Verificar Configuração do Proxy (Nginx/Apache)**

**Se o backend está rodando mas ainda dá 502:**

O problema pode estar na configuração do proxy. Verifique:

**Via SSH:**

```bash
# Verificar se o .htaccess existe (Apache)
ls -la /www/.htaccess

# Ver conteúdo do .htaccess
cat /www/.htaccess | grep -i proxy
```

**Deve conter:**
```apache
ProxyPass /api http://localhost:21008/api
ProxyPassReverse /api http://localhost:21008/api
```

**Se não existir ou estiver incorreto:**
- Crie/edite o arquivo `.htaccess` em `/www/`
- Veja o arquivo `CONFIGURAR_PROXY_KINGHOST.md` para configuração completa

---

## 🚨 Problemas Comuns e Soluções

### Problema 1: "Porta 21008 já em uso"

**Solução:**
```bash
# Encontrar processo usando a porta
lsof -i :21008
# ou
netstat -tulpn | grep 21008

# Matar o processo (substitua PID pelo número do processo)
kill -9 <PID>

# Reiniciar backend
pm2 restart crm
```

---

### Problema 2: "Erro de conexão com banco de dados"

**Solução:**
1. Verificar se as credenciais no `.env` estão corretas
2. Verificar se o firewall do banco permite conexões do servidor
3. Testar conexão manualmente:
   ```bash
   psql -h pgsql01.redehost.com.br -U seu_usuario -d seu_banco
   ```

---

### Problema 3: "Cannot find module"

**Solução:**
```bash
cd /apps_nodejs/crm
rm -rf node_modules
npm install --production
pm2 restart crm
```

---

### Problema 4: "JWT_SECRET não definido"

**Solução:**
1. Editar arquivo `.env`:
   ```bash
   nano /apps_nodejs/crm/.env
   ```
2. Adicionar:
   ```env
   JWT_SECRET=sua_chave_secreta_minimo_32_caracteres
   ```
3. Reiniciar backend:
   ```bash
   pm2 restart crm
   ```

---

## 📋 Checklist de Diagnóstico

Execute estes comandos na ordem:

- [ ] `pm2 status` - Verificar se backend está rodando
- [ ] `pm2 logs crm --lines 50` - Verificar logs de erro
- [ ] `netstat -tulpn | grep 21008` - Verificar se porta está em uso
- [ ] `curl http://localhost:21008/api` - Testar backend localmente
- [ ] `ls -la /apps_nodejs/crm/.env` - Verificar se .env existe
- [ ] `cat /apps_nodejs/crm/.env | grep PORT_SERVER` - Verificar porta configurada
- [ ] `ls -la /apps_nodejs/crm/dist/main.js` - Verificar se build existe
- [ ] `ls -la /www/.htaccess` - Verificar configuração de proxy

---

## 🎯 Comandos Rápidos de Recuperação

**Se o backend não estiver rodando:**

```bash
cd /apps_nodejs/crm
pm2 restart crm
pm2 logs crm
```

**Se ainda não funcionar:**

```bash
cd /apps_nodejs/crm
pm2 delete crm
pm2 start server.js --name crm
pm2 save
pm2 logs crm
```

**Se ainda não funcionar:**

```bash
cd /apps_nodejs/crm
rm -rf node_modules
npm install --production
npm run build
pm2 delete crm
pm2 start server.js --name crm
pm2 save
pm2 logs crm
```

---

## 💡 Dica Final

**Se nada funcionar:**

1. Verifique os logs completos: `pm2 logs crm --lines 200`
2. Copie os erros e verifique:
   - Erros de banco de dados
   - Erros de módulos não encontrados
   - Erros de porta
   - Erros de arquivo não encontrado
3. Verifique se o arquivo `.env` está completo (veja `ARQUIVO_ENV_COMPLETO.md`)
4. Se necessário, contate o suporte da KingHost com os logs de erro

---

## ✅ Verificação Final

Após aplicar as soluções, teste:

1. **Backend localmente:**
   ```bash
   curl http://localhost:21008/api
   ```
   Deve retornar algo (mesmo que 404)

2. **Via navegador:**
   ```
   http://www.crmcc.kinghost.net:21008/api
   ```
   Deve retornar algo (mesmo que 404)

3. **Frontend:**
   ```
   http://www.crmcc.kinghost.net
   ```
   Deve carregar a aplicação sem erro 502

---

**Pronto!** 🎉 Siga os passos acima na ordem e o erro 502 deve ser resolvido.


