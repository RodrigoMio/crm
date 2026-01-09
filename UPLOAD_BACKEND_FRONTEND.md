# 📤 Upload de Backend e Frontend - Guia Completo

Este guia explica como fazer upload dos arquivos do **backend** e **frontend** separadamente na KingHost.

---

## 🎯 Visão Geral

A aplicação tem **duas partes** que vão para **lugares diferentes**:

1. **Backend (Node.js)** → Aplicação Node.js na KingHost
2. **Frontend (React)** → Hospedagem Web (pasta www)

---

## 📦 PARTE 1: Backend (Node.js)

### 📍 Onde Fazer Upload

**Destino:** `/home/crmcc/apps_nodejs/crm/`

### 📋 Arquivos para Upload

Do diretório `backend/`, você precisa enviar:

#### ✅ Arquivos Obrigatórios

1. **`server.js`**
   - Origem: `C:\Users\rjmio\projetos-cursor\CRM\backend\server.js`
   - Destino: `/home/crmcc/apps_nodejs/crm/server.js`

2. **`package.json`**
   - Origem: `C:\Users\rjmio\projetos-cursor\CRM\backend\package.json`
   - Destino: `/home/crmcc/apps_nodejs/crm/package.json`

3. **`package-lock.json`**
   - Origem: `C:\Users\rjmio\projetos-cursor\CRM\backend\package-lock.json`
   - Destino: `/home/crmcc/apps_nodejs/crm/package-lock.json`

4. **Pasta `dist/` (COMPLETA)**
   - Origem: `C:\Users\rjmio\projetos-cursor\CRM\backend\dist\` (pasta completa)
   - Destino: `/home/crmcc/apps_nodejs/crm/dist/` (pasta completa)
   - **Importante:** Envie TODA a pasta, não apenas `main.js`

#### ⚠️ Arquivo a Criar no Servidor

5. **`.env`**
   - **NÃO enviar do local**
   - Criar diretamente no servidor em: `/home/crmcc/apps_nodejs/crm/.env`
   - Conteúdo: variáveis de ambiente (banco, JWT, etc.)

### 📁 Estrutura Final do Backend

```
/home/crmcc/apps_nodejs/crm/
├── server.js              ✅ Upload
├── package.json           ✅ Upload
├── package-lock.json      ✅ Upload
├── .env                   ✅ Criar no servidor
├── dist/                  ✅ Upload (pasta completa)
│   ├── main.js
│   ├── app.module.js
│   ├── auth/
│   ├── leads/
│   ├── users/
│   └── ...
└── node_modules/          ✅ Criado após npm install
```

### 🔧 Após Upload do Backend

1. **Criar arquivo `.env`** no servidor
2. **Instalar dependências:**
   ```bash
   cd /home/crmcc/apps_nodejs/crm/
   npm install --production
   ```
3. **Configurar aplicação** no painel da KingHost
4. **Reiniciar aplicação**

---

## 🎨 PARTE 2: Frontend (React)

### 📍 Onde Fazer Upload

**Destino:** `/home/crmcc/www/` (ou pasta de hospedagem web configurada)

### 📋 Arquivos para Upload

Do diretório `frontend/dist/`, você precisa enviar:

#### ✅ Arquivos Obrigatórios

**TODOS os arquivos da pasta `frontend/dist/`:**

1. **`index.html`**
   - Origem: `C:\Users\rjmio\projetos-cursor\CRM\frontend\dist\index.html`
   - Destino: `/home/crmcc/www/index.html`

2. **Pasta `assets/` (COMPLETA)**
   - Origem: `C:\Users\rjmio\projetos-cursor\CRM\frontend\dist\assets\` (pasta completa)
   - Destino: `/home/crmcc/www/assets/` (pasta completa)
   - Contém: arquivos JS, CSS, imagens, etc.

3. **`.htaccess` (para Apache)**
   - Origem: `C:\Users\rjmio\projetos-cursor\CRM\frontend\.htaccess`
   - Destino: `/home/crmcc/www/.htaccess`
   - **Importante:** Necessário para SPA (Single Page Application)

#### ⚠️ Antes do Upload do Frontend

**Configurar URL da API:**

1. **Criar arquivo `.env.production`** no diretório `frontend/`:
   ```env
   VITE_API_URL=https://api.crmcc.kinghost.net
   ```
   (Ajuste para a URL real do seu backend)

2. **Refazer o build:**
   ```bash
   cd frontend
   npm run build
   ```

### 📁 Estrutura Final do Frontend

```
/home/crmcc/www/
├── index.html             ✅ Upload
├── .htaccess              ✅ Upload
└── assets/                ✅ Upload (pasta completa)
    ├── index-xxxxx.js
    ├── index-xxxxx.css
    └── ...
```

### 🔧 Após Upload do Frontend

1. **Verificar se `index.html` está na raiz**
2. **Verificar se `.htaccess` foi enviado**
3. **Testar acesso:** `https://crmcc.kinghost.net`
4. **Verificar se as requisições para API estão funcionando**

---

## 📊 Tabela Resumo: Origem → Destino

### Backend

| Arquivo/Pasta | 📍 ORIGEM | 🎯 DESTINO |
|---------------|-----------|------------|
| `server.js` | `backend/server.js` | `/home/crmcc/apps_nodejs/crm/server.js` |
| `package.json` | `backend/package.json` | `/home/crmcc/apps_nodejs/crm/package.json` |
| `package-lock.json` | `backend/package-lock.json` | `/home/crmcc/apps_nodejs/crm/package-lock.json` |
| `dist/` | `backend/dist/` | `/home/crmcc/apps_nodejs/crm/dist/` |
| `.env` | ❌ Não enviar | `/home/crmcc/apps_nodejs/crm/.env` (criar) |

### Frontend

| Arquivo/Pasta | 📍 ORIGEM | 🎯 DESTINO |
|---------------|-----------|------------|
| `index.html` | `frontend/dist/index.html` | `/home/crmcc/www/index.html` |
| `assets/` | `frontend/dist/assets/` | `/home/crmcc/www/assets/` |
| `.htaccess` | `frontend/.htaccess` | `/home/crmcc/www/.htaccess` |

---

## 🚀 Ordem de Upload Recomendada

### Passo 1: Preparar Backend

```bash
# No seu computador
cd backend
npm install
npm run build
```

**Verificar:**
- ✅ `dist/main.js` existe
- ✅ `dist/` contém todos os arquivos

### Passo 2: Upload do Backend

1. Fazer upload de:
   - `server.js`
   - `package.json`
   - `package-lock.json`
   - Pasta `dist/` completa

2. Destino: `/home/crmcc/apps_nodejs/crm/`

### Passo 3: Configurar Backend no Servidor

1. Criar arquivo `.env`
2. Executar `npm install --production`
3. Configurar aplicação no painel
4. Reiniciar aplicação

### Passo 4: Preparar Frontend

```bash
# No seu computador
cd frontend

# Criar .env.production com URL da API
echo "VITE_API_URL=https://api.crmcc.kinghost.net" > .env.production

# Build
npm install
npm run build
```

**Verificar:**
- ✅ `dist/index.html` existe
- ✅ `dist/assets/` contém arquivos JS e CSS

### Passo 5: Upload do Frontend

1. Fazer upload de:
   - Todo o conteúdo de `frontend/dist/`
   - Arquivo `.htaccess`

2. Destino: `/home/crmcc/www/`

### Passo 6: Verificar

1. **Backend:** `https://api.crmcc.kinghost.net/api`
2. **Frontend:** `https://crmcc.kinghost.net`
3. **Testar login** no frontend

---

## 📋 Checklist Completo

### Backend

- [ ] Executei `npm run build` no backend
- [ ] Verifiquei que `dist/main.js` existe
- [ ] Fiz upload de `server.js`
- [ ] Fiz upload de `package.json`
- [ ] Fiz upload de `package-lock.json`
- [ ] Fiz upload da pasta `dist/` completa
- [ ] Criei arquivo `.env` no servidor
- [ ] Executei `npm install --production` no servidor
- [ ] Configurei aplicação no painel
- [ ] Reiniciei aplicação
- [ ] Testei: `curl http://localhost:21008/api`

### Frontend

- [ ] Criei `.env.production` com URL da API
- [ ] Executei `npm run build` no frontend
- [ ] Verifiquei que `dist/index.html` existe
- [ ] Fiz upload de `index.html`
- [ ] Fiz upload da pasta `assets/` completa
- [ ] Fiz upload de `.htaccess`
- [ ] Testei acesso: `https://crmcc.kinghost.net`
- [ ] Testei login no frontend
- [ ] Verifiquei se requisições para API funcionam

---

## 🔍 Verificação Pós-Upload

### Backend

```bash
# Via SSH
ssh crmcc@nodejsng1f02
cd /home/crmcc/apps_nodejs/crm/

# Verificar arquivos
ls -la
ls -la dist/

# Verificar se node_modules existe
ls -la node_modules/

# Testar aplicação
curl http://localhost:21008/api
```

### Frontend

```bash
# Via SSH ou Gerenciador de Arquivos
cd /home/crmcc/www/

# Verificar arquivos
ls -la
ls -la assets/

# Verificar se index.html existe
ls -la index.html

# Verificar se .htaccess existe
ls -la .htaccess
```

---

## ⚠️ Pontos Importantes

### Backend

1. **A pasta `dist/` deve ser enviada COMPLETA**
   - Não envie apenas `main.js`
   - Envie todos os arquivos e subpastas

2. **O arquivo `.env` NÃO deve ser enviado do local**
   - Crie diretamente no servidor
   - Contém informações sensíveis

3. **Sempre execute `npm install --production` após upload**

### Frontend

1. **Configure a URL da API ANTES do build**
   - Crie `.env.production` com `VITE_API_URL`
   - Refazer build após configurar

2. **Envie TODOS os arquivos de `dist/`**
   - `index.html` na raiz
   - Pasta `assets/` completa
   - `.htaccess` (importante para SPA)

3. **O `.htaccess` é necessário** para funcionar como SPA
   - Sem ele, rotas do React não funcionarão

---

## 🎯 Resumo Visual

```
SEU COMPUTADOR
├── backend/
│   ├── server.js          ────┐
│   ├── package.json        ────┤
│   ├── package-lock.json   ────┤
│   └── dist/               ────┼──→ /home/crmcc/apps_nodejs/crm/
│       └── ...                  │
│                               │
└── frontend/                    │
    └── dist/                    │
        ├── index.html      ────┼──→ /home/crmcc/www/
        ├── assets/          ────┤
        └── ...                  │
                                 │
    .htaccess                ───┘
```

---

## 📚 Documentação Relacionada

- **[ORIGEM_DESTINO_ARQUIVOS.md](./ORIGEM_DESTINO_ARQUIVOS.md)** - Detalhes sobre origem e destino
- **[GUIA_UPLOAD_ARQUIVOS.md](./GUIA_UPLOAD_ARQUIVOS.md)** - Métodos de upload
- **[PASSOS_APOS_UPLOAD.md](./PASSOS_APOS_UPLOAD.md)** - O que fazer após upload
- **[CONFIGURAR_NGINX_KINGHOST.md](./CONFIGURAR_NGINX_KINGHOST.md)** - Configurar Nginx

---

## ✅ Pronto!

Agora você sabe exatamente:
- ✅ Quais arquivos enviar do backend
- ✅ Quais arquivos enviar do frontend
- ✅ Para onde enviar cada um
- ✅ O que fazer após o upload

Siga a ordem recomendada e use o checklist para garantir que nada foi esquecido!







