# 📤 Guia Completo de Upload de Arquivos para KingHost

Este guia explica **quais arquivos enviar** e **como fazer o upload** para a KingHost.

---

## 📋 Índice

1. [Arquivos Necessários](#arquivos-necessários)
2. [Preparação Antes do Upload](#preparação-antes-do-upload)
3. [Métodos de Upload](#métodos-de-upload)
4. [Estrutura de Diretórios](#estrutura-de-diretórios)
5. [Checklist Completo](#checklist-completo)

---

## 📦 Arquivos Necessários

### Backend - Arquivos para Upload

Você precisa enviar os seguintes arquivos do diretório `backend/`:

#### ✅ Arquivos Obrigatórios

1. **`server.js`** 
   - Arquivo de inicialização da aplicação
   - Localização: `backend/server.js`
   - Deve estar na raiz do diretório da aplicação

2. **`package.json`**
   - Define as dependências do projeto
   - Localização: `backend/package.json`
   - Necessário para instalar as dependências

3. **`package-lock.json`**
   - Lock file das dependências
   - Localização: `backend/package-lock.json`
   - Garante versões consistentes

4. **Pasta `dist/` (COMPLETA)**
   - Contém o código compilado do NestJS
   - Deve incluir TODOS os arquivos dentro de `dist/`
   - Localização: `backend/dist/`
   - **Importante:** Envie a pasta inteira, não apenas `main.js`

#### ⚠️ Arquivo a Criar no Servidor

5. **`.env`**
   - Variáveis de ambiente (NÃO enviar do local)
   - Deve ser criado diretamente no servidor
   - Contém credenciais sensíveis

#### ❌ Arquivos que NÃO devem ser enviados

- `src/` (código fonte TypeScript)
- `node_modules/` (será instalado no servidor)
- `tsconfig.json`
- `nest-cli.json`
- Qualquer arquivo `.ts` (código fonte)
- Arquivos de teste
- `.git/` e outros arquivos de controle de versão

---

## 🔧 Preparação Antes do Upload

### Passo 1: Build do Backend

Antes de fazer upload, você DEVE compilar o código:

```bash
cd backend
npm install
npm run build
```

**Verifique se a pasta `dist/` foi criada:**
```bash
# Verificar se dist/main.js existe
ls backend/dist/main.js
```

### Passo 2: Verificar Arquivos

Certifique-se de que os seguintes arquivos existem:

```bash
# No diretório backend/
✅ server.js
✅ package.json
✅ package-lock.json
✅ dist/main.js
✅ dist/ (pasta completa com todos os arquivos)
```

### Passo 3: Preparar para Upload

Organize os arquivos que serão enviados:

```
Arquivos para upload:
├── server.js
├── package.json
├── package-lock.json
└── dist/
    ├── main.js
    ├── app.module.js
    ├── auth/
    ├── leads/
    ├── users/
    └── ... (todos os arquivos compilados)
```

---

## 📤 Métodos de Upload

A KingHost oferece várias formas de fazer upload. Escolha a mais adequada:

### Método 1: Gerenciador de Arquivos (Painel Web) ⭐ Recomendado

**Vantagens:**
- Não requer software adicional
- Interface visual
- Fácil de usar

**Passos:**

1. **Acesse o painel da KingHost**
2. **Navegue até "Gerenciador de Arquivos"** ou "File Manager"
3. **Localize o diretório da aplicação Node.js:**
   - Geralmente: `/home/[usuario]/apps_nodejs/[nome_app]/`
   - Exemplo: `/home/crmcc/apps_nodejs/crm/`
4. **Faça upload dos arquivos:**
   - Clique em "Upload" ou "Enviar Arquivo"
   - Selecione `server.js`
   - Selecione `package.json`
   - Selecione `package-lock.json`
   - Para a pasta `dist/`, você pode:
     - Fazer upload de cada arquivo individualmente (não recomendado)
     - Ou criar a pasta `dist/` primeiro e depois fazer upload dos arquivos dentro dela
     - Ou usar um arquivo ZIP (veja método alternativo abaixo)

**⚠️ Dica:** Para a pasta `dist/`, é mais fácil:
1. Compactar a pasta `dist/` em um arquivo ZIP localmente
2. Fazer upload do ZIP
3. Extrair o ZIP no servidor (via painel ou SSH)

---

### Método 2: FTP/SFTP

**Vantagens:**
- Upload em lote
- Mais rápido para muitos arquivos
- Mantém estrutura de pastas

**Ferramentas recomendadas:**
- **FileZilla** (Windows/Mac/Linux) - Gratuito
- **WinSCP** (Windows) - Gratuito
- **Cyberduck** (Mac/Windows) - Gratuito

**Passos:**

1. **Obter credenciais FTP na KingHost:**
   - Acesse o painel da KingHost
   - Procure por "FTP" ou "Acesso FTP"
   - Anote: Host, Usuário, Senha, Porta

2. **Conectar via cliente FTP:**
   ```
   Host: ftp.kinghost.net (ou o host fornecido)
   Usuário: seu_usuario
   Senha: sua_senha
   Porta: 21 (FTP) ou 22 (SFTP)
   ```

3. **Navegar até o diretório:**
   ```
   /home/[usuario]/apps_nodejs/[nome_app]/
   ```

4. **Fazer upload:**
   - Arraste e solte os arquivos
   - Ou selecione e clique em "Upload"
   - **Importante:** Mantenha a estrutura de pastas
   - A pasta `dist/` deve ser enviada completa

---

### Método 3: SSH/SCP (Linha de Comando)

**Vantagens:**
- Mais rápido
- Automatizável
- Mantém permissões

**Requisitos:**
- Acesso SSH habilitado na KingHost
- Cliente SSH (Git Bash, PowerShell, Terminal)

**Passos:**

1. **Compactar os arquivos localmente:**
   ```bash
   # No diretório backend/
   tar -czf deploy.tar.gz server.js package.json package-lock.json dist/
   ```

2. **Transferir via SCP:**
   ```bash
   scp deploy.tar.gz usuario@kinghost.net:/home/usuario/apps_nodejs/crm/
   ```

3. **Conectar via SSH e extrair:**
   ```bash
   ssh usuario@kinghost.net
   cd /home/usuario/apps_nodejs/crm/
   tar -xzf deploy.tar.gz
   rm deploy.tar.gz  # Remove o arquivo compactado
   ```

**Alternativa - Upload direto de arquivos:**
```bash
# Upload de arquivo individual
scp server.js usuario@kinghost.net:/home/usuario/apps_nodejs/crm/

# Upload de pasta completa
scp -r dist/ usuario@kinghost.net:/home/usuario/apps_nodejs/crm/
```

---

### Método 4: ZIP via Painel

**Vantagens:**
- Fácil para pastas grandes
- Mantém estrutura

**Passos:**

1. **Compactar localmente:**
   ```bash
   # No diretório backend/
   # Windows:
   Compress-Archive -Path server.js,package.json,package-lock.json,dist -DestinationPath deploy.zip
   
   # Linux/Mac:
   zip -r deploy.zip server.js package.json package-lock.json dist/
   ```

2. **Fazer upload do ZIP via painel**

3. **Extrair no servidor:**
   - Via painel: Clique com botão direito no ZIP → "Extrair"
   - Via SSH: `unzip deploy.zip && rm deploy.zip`

---

## 📁 Estrutura de Diretórios

### Estrutura Local (Antes do Upload)

```
backend/
├── src/              ❌ NÃO enviar
├── node_modules/     ❌ NÃO enviar
├── dist/             ✅ ENVIAR (pasta completa)
│   ├── main.js
│   ├── app.module.js
│   ├── auth/
│   ├── leads/
│   └── ...
├── server.js         ✅ ENVIAR
├── package.json      ✅ ENVIAR
├── package-lock.json ✅ ENVIAR
└── .env              ❌ NÃO enviar (criar no servidor)
```

### Estrutura no Servidor (Após Upload)

```
/home/crmcc/apps_nodejs/crm/
├── server.js         ✅ Upload feito
├── package.json      ✅ Upload feito
├── package-lock.json ✅ Upload feito
├── .env              ✅ Criar manualmente no servidor
├── dist/             ✅ Upload feito (pasta completa)
│   ├── main.js
│   ├── app.module.js
│   ├── auth/
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│   │   └── ...
│   ├── leads/
│   ├── users/
│   └── ...
└── node_modules/     ✅ Será criado após npm install
```

---

## ✅ Checklist Completo

Use este checklist para garantir que tudo foi feito corretamente:

### Antes do Upload

- [ ] Executei `npm install` no backend
- [ ] Executei `npm run build` no backend
- [ ] Verifiquei que `dist/main.js` existe
- [ ] Verifiquei que `dist/` contém todos os arquivos compilados
- [ ] Organizei os arquivos que serão enviados

### Arquivos para Upload

- [ ] `server.js` está pronto
- [ ] `package.json` está atualizado
- [ ] `package-lock.json` existe
- [ ] Pasta `dist/` completa está pronta

### Upload

- [ ] Fiz upload de `server.js`
- [ ] Fiz upload de `package.json`
- [ ] Fiz upload de `package-lock.json`
- [ ] Fiz upload da pasta `dist/` completa (com todos os arquivos dentro)

### No Servidor

- [ ] Verifiquei que todos os arquivos foram enviados corretamente
- [ ] Criei o arquivo `.env` com as variáveis de ambiente
- [ ] Executei `npm install --production` no servidor
- [ ] Verifiquei que `node_modules/` foi criado
- [ ] Verifiquei que a estrutura de diretórios está correta

### Configuração

- [ ] Configurei os campos no painel da KingHost (Script, etc.)
- [ ] Verifiquei os logs da aplicação
- [ ] Testei a conexão com o banco de dados

---

## 🔍 Verificação Pós-Upload

Após fazer o upload, verifique se tudo está correto:

### Via Painel (Gerenciador de Arquivos)

1. Navegue até o diretório da aplicação
2. Verifique se você vê:
   - ✅ `server.js`
   - ✅ `package.json`
   - ✅ `package-lock.json`
   - ✅ Pasta `dist/` (clique para verificar se tem `main.js` dentro)

### Via SSH

```bash
# Conectar ao servidor
ssh usuario@kinghost.net

# Navegar até o diretório
cd /home/usuario/apps_nodejs/crm/

# Listar arquivos
ls -la

# Verificar estrutura da pasta dist
ls -la dist/

# Verificar se main.js existe
ls -la dist/main.js
```

**Saída esperada:**
```
server.js
package.json
package-lock.json
dist/
.env (depois de criar)
```

---

## 🐛 Problemas Comuns

### Problema: "Arquivo dist/main.js não encontrado"

**Causa:** A pasta `dist/` não foi enviada completamente ou o build não foi executado.

**Solução:**
1. Execute `npm run build` localmente novamente
2. Verifique se `dist/main.js` existe localmente
3. Faça upload da pasta `dist/` completa novamente
4. Certifique-se de que todos os arquivos dentro de `dist/` foram enviados

### Problema: "Cannot find module"

**Causa:** Dependências não foram instaladas no servidor.

**Solução:**
```bash
cd /home/usuario/apps_nodejs/crm/
npm install --production
```

### Problema: "Permission denied"

**Causa:** Permissões incorretas nos arquivos.

**Solução:**
```bash
chmod 644 server.js package.json package-lock.json
chmod -R 755 dist/
```

### Problema: Estrutura de pastas incorreta

**Causa:** Arquivos foram enviados para o diretório errado ou estrutura foi quebrada.

**Solução:**
1. Verifique o caminho correto no painel da KingHost
2. Reorganize os arquivos na estrutura correta
3. Certifique-se de que `server.js` e `dist/` estão no mesmo diretório

---

## 📝 Resumo Rápido

**Arquivos para enviar:**
1. `server.js`
2. `package.json`
3. `package-lock.json`
4. `dist/` (pasta completa)

**Onde enviar:**
- Diretório: `/home/[usuario]/apps_nodejs/[nome_app]/`

**Após upload:**
1. Criar `.env` no servidor
2. Executar `npm install --production`
3. Configurar campos no painel da KingHost
4. Verificar logs

---

## 🎯 Próximos Passos

Após fazer o upload dos arquivos:

1. 📖 Consulte [CONFIGURACAO_KINGHOST.md](./CONFIGURACAO_KINGHOST.md) para configurar os campos no painel
2. 📖 Consulte [backend/DEPLOY_KINGHOST.md](./backend/DEPLOY_KINGHOST.md) para os próximos passos
3. 🔧 Configure o arquivo `.env` no servidor
4. 📦 Execute `npm install --production` no servidor
5. ✅ Verifique os logs da aplicação










