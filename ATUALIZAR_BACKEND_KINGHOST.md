# 🚀 Passo a Passo - Atualizar Backend na KingHost

Guia objetivo para atualizar apenas o backend do CRM na KingHost.

---

## 📋 ESTRUTURA NA KINGHOST

```
/apps_nodejs/crm/
├── dist/              ← Código compilado (atualizar)
├── server.js          ← Arquivo de inicialização (atualizar se mudou)
├── package.json       ← Dependências (atualizar se mudou)
├── package-lock.json  ← Lock file (atualizar se mudou)
├── .env               ← Variáveis de ambiente (NÃO alterar)
└── node_modules/      ← Será reinstalado se necessário
```

---

## 🔧 PARTE 1: PREPARAÇÃO NA MÁQUINA LOCAL

### 1.1. Build do Backend

Execute no terminal (na raiz do projeto):

```powershell
cd backend
npm install
npm run build
```

**Verificar se o build foi bem-sucedido:**
```powershell
# Verificar se dist/main.js existe
Test-Path backend\dist\main.js
```

**Arquivos gerados:**
- ✅ `backend/dist/` (pasta completa com código compilado)
- ✅ `backend/dist/main.js` (arquivo principal)

---

## 📦 PARTE 2: ARQUIVOS PARA ATUALIZAR

### 2.1. Arquivos que DEVEM ser atualizados

| Arquivo/Pasta | Origem Local | Destino KingHost |
|---------------|--------------|------------------|
| `dist/` (pasta completa) | `C:\Users\rjmio\projetos-cursor\CRM\backend\dist\` | `/apps_nodejs/crm/dist/` |
| `server.js` | `C:\Users\rjmio\projetos-cursor\CRM\backend\server.js` | `/apps_nodejs/crm/server.js` |

**⚠️ IMPORTANTE:**
- Envie a pasta `dist/` COMPLETA, substituindo a anterior
- Todos os subdiretórios dentro de `dist/` devem ser copiados
- Se `server.js` foi modificado, atualize também

### 2.2. Arquivos que PODEM precisar atualizar

| Arquivo | Quando atualizar |
|---------|-----------------|
| `package.json` | Se adicionou/removeu dependências |
| `package-lock.json` | Se `package.json` foi alterado |

### 2.3. Arquivos que NÃO devem ser alterados

- ❌ `.env` (mantenha como está, a menos que precise alterar configurações)
- ❌ `node_modules/` (será reinstalado automaticamente se necessário)

---

## 📤 PARTE 3: UPLOAD DOS ARQUIVOS

### 3.1. Método: FTP/SFTP

**Usando FileZilla ou similar:**

1. **Conecte-se ao servidor KingHost:**
   - Host: `ftp.kinghost.net` (ou o fornecido pela KingHost)
   - Usuário: seu usuário FTP
   - Senha: sua senha FTP
   - Porta: 21 (FTP) ou 22 (SFTP)

2. **Navegue até o diretório:**
   ```
   /apps_nodejs/crm/
   ```

3. **Faça upload dos arquivos:**
   - **Substitua** a pasta `dist/` completa
   - **Substitua** o arquivo `server.js` (se foi modificado)
   - **Substitua** `package.json` e `package-lock.json` (se foram modificados)

**⚠️ Dica:** Delete a pasta `dist/` antiga antes de fazer upload da nova, para evitar arquivos órfãos.

---

## 🔄 PARTE 4: COMANDOS NO SERVIDOR (via SSH)

### 4.1. Conectar via SSH

Acesse o terminal SSH da KingHost (via painel ou cliente SSH).

### 4.2. Navegar até o diretório

```bash
cd /apps_nodejs/crm
```

### 4.3. Verificar se há novas dependências

Se você atualizou `package.json`, instale as novas dependências:

```bash
npm install --production
```

**Nota:** O `--production` instala apenas dependências de produção (sem devDependencies).

### 4.4. Reiniciar a aplicação

**Opção A - Via PM2 (Recomendado):**

```bash
# Ver processos PM2
pm2 list

# Reiniciar aplicação
pm2 restart crm

# Ou se o nome for diferente, verifique com:
pm2 list

# Reiniciar pelo ID ou nome
pm2 restart 0
```

**Opção B - Parar e Iniciar:**

```bash
# Parar aplicação
pm2 stop crm

# Iniciar aplicação
pm2 start crm
```

**Opção C - Se não usar PM2:**

```bash
# Parar processo Node.js (encontre o PID primeiro)
ps aux | grep node

# Matar processo
kill -9 <PID>

# Iniciar novamente
node server.js
```

---

## ✅ PARTE 5: VERIFICAÇÃO

### 5.1. Verificar se a aplicação está rodando

```bash
# Ver logs do PM2
pm2 logs crm

# Ou ver status
pm2 status
```

### 5.2. Verificar logs de erro

```bash
# Ver últimos logs
pm2 logs crm --lines 50

# Ver logs em tempo real
pm2 logs crm
```

### 5.3. Testar a API

Acesse no navegador ou via curl:

```bash
# Testar endpoint de health (se existir)
curl http://localhost:21008/health

# Ou testar endpoint de API
curl http://localhost:21008/api
```

---

## 🔍 TROUBLESHOOTING

### Problema: Aplicação não inicia

**Solução:**
1. Verifique os logs: `pm2 logs crm`
2. Verifique se o arquivo `dist/main.js` existe
3. Verifique se as dependências estão instaladas: `npm list`
4. Verifique o arquivo `.env` está correto

### Problema: Erro de módulo não encontrado

**Solução:**
```bash
cd /apps_nodejs/crm
rm -rf node_modules
npm install --production
pm2 restart crm
```

### Problema: Porta já em uso

**Solução:**
```bash
# Verificar qual processo está usando a porta
lsof -i :21008

# Matar processo se necessário
kill -9 <PID>
```

### Problema: Mudanças não aparecem

**Solução:**
1. Certifique-se de que fez upload da pasta `dist/` completa
2. Verifique se reiniciou o PM2: `pm2 restart crm`
3. Limpe o cache do navegador
4. Verifique os logs para erros: `pm2 logs crm`

---

## 📝 CHECKLIST RÁPIDO

- [ ] Build do backend executado localmente (`npm run build`)
- [ ] Pasta `dist/` atualizada no servidor
- [ ] Arquivo `server.js` atualizado (se foi modificado)
- [ ] Arquivos `package.json` e `package-lock.json` atualizados (se necessário)
- [ ] Dependências instaladas no servidor (`npm install --production`)
- [ ] Aplicação reiniciada (`pm2 restart crm`)
- [ ] Logs verificados (`pm2 logs crm`)
- [ ] API testada e funcionando

---

## 🚀 RESUMO RÁPIDO (Comandos Essenciais)

**Local:**
```powershell
cd backend
npm run build
```

**Servidor (SSH):**
```bash
cd /apps_nodejs/crm
npm install --production  # Apenas se package.json mudou
pm2 restart crm
pm2 logs crm
```

---

## 📌 NOTAS IMPORTANTES

1. **Sempre faça backup** antes de atualizar (especialmente do `.env`)
2. **Não altere o `.env`** a menos que seja necessário
3. **Mantenha a estrutura de pastas** como está
4. **Verifique os logs** após cada atualização
5. **Teste a aplicação** após atualizar

---

## 🆘 SUPORTE

Se encontrar problemas:
1. Verifique os logs: `pm2 logs crm`
2. Verifique se o build local está funcionando
3. Verifique se todos os arquivos foram enviados corretamente
4. Verifique se as dependências estão instaladas

---

**Última atualização:** $(Get-Date -Format "dd/MM/yyyy HH:mm")



