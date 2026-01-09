# ⚙️ Configuração dos Campos na KingHost

Este guia explica como preencher cada campo no painel de configuração da aplicação Node.js na KingHost.

## 📋 Campos do Formulário

### 1. **Versão do NodeJS**

**O que preencher:**
- Selecione **Node.JS 22 (LTS)** ou **Node.JS 20 (LTS)**
- Recomendado: **Node.JS 22 (LTS)** se disponível
- Evite versões muito antigas (menores que 18)

**Por quê:**
- O NestJS e as dependências modernas requerem Node.js 18+
- Versões LTS (Long Term Support) são mais estáveis

---

### 2. **Nome da Aplicação**

**O que preencher:**
```
CRM Backend
```
ou
```
crm-backend
```

**Por quê:**
- É apenas um identificador interno
- Use um nome descritivo para facilitar a identificação
- Não afeta o funcionamento da aplicação

---

### 3. **Caminho da Aplicação**

**O que preencher:**

**Opção A: Se você quer acessar via subdomínio ou domínio dedicado:**
- Deixe apenas `/` (raiz)
- Configure um domínio/subdomínio separado para o backend
- Exemplo: `api.seudominio.com`

**Opção B: Se você quer acessar via caminho no mesmo domínio:**
- Preencha com: `/api` ou `/backend`
- Exemplo: `crmcc.kinghost.net/api`

**⚠️ IMPORTANTE:**
- O backend NestJS já usa o prefixo `/api` em todas as rotas
- Se você colocar `/api` aqui, as rotas ficarão: `dominio.com/api/api/...`
- **Recomendação:** Deixe apenas `/` e configure um subdomínio separado

**Estrutura recomendada:**
```
/                    (raiz)
```

---

### 4. **Script (Arquivo Inicial)**

**O que preencher:**

**Caminho completo para o arquivo server.js:**

```
/home/crmcc/apps_nodejs/crm/server.js
```

ou, se o diretório for diferente:

```
/home/crmcc/apps_nodejs/crm-backend/server.js
```

**Como descobrir o caminho correto:**

1. **Via painel de arquivos da KingHost:**
   - Navegue até onde você fez upload dos arquivos
   - O caminho geralmente é: `/home/[seu_usuario]/apps_nodejs/[nome_da_pasta]/server.js`

2. **Via SSH (se tiver acesso):**
   ```bash
   # Conecte-se via SSH
   pwd  # Mostra o diretório atual
   ls -la  # Lista os arquivos
   # Procure pelo server.js
   ```

3. **Estrutura esperada:**
   ```
   /home/crmcc/apps_nodejs/crm/
   ├── server.js          ← Este é o arquivo do Script
   ├── package.json
   ├── package-lock.json
   ├── .env
   └── dist/
       └── main.js
   ```

**⚠️ IMPORTANTE:**
- Use o caminho **completo e absoluto** (começando com `/home/`)
- Não use caminhos relativos
- O arquivo `server.js` deve estar no mesmo diretório onde você fez upload
- Certifique-se de que o arquivo existe antes de salvar

---

## ✅ Exemplo Completo de Preenchimento

Baseado na estrutura padrão da KingHost:

| Campo | Valor |
|-------|-------|
| **Versão do NodeJS** | `Node.JS 22 (LTS)` |
| **Nome da Aplicação** | `CRM Backend` |
| **Caminho da Aplicação** | `/` (raiz) |
| **Script** | `/home/crmcc/apps_nodejs/crm/server.js` |

---

## 🔍 Verificações Antes de Salvar

Antes de salvar a configuração, certifique-se de:

1. ✅ **Arquivo server.js existe** no caminho especificado
2. ✅ **Pasta dist/ existe** no mesmo diretório do server.js
3. ✅ **Arquivo dist/main.js existe** (resultado do build)
4. ✅ **Arquivo .env existe** com as variáveis de ambiente configuradas
5. ✅ **package.json existe** no mesmo diretório

---

## 🚀 Após Salvar

1. **Verifique os logs** da aplicação no painel da KingHost
2. **Teste a conexão** fazendo uma requisição para a API
3. **Se houver erros**, verifique:
   - Se o caminho do Script está correto
   - Se o arquivo server.js existe
   - Se a pasta dist/ foi enviada corretamente
   - Se as variáveis de ambiente estão configuradas

---

## 🐛 Troubleshooting

### Erro: "Script não encontrado"
**Solução:**
- Verifique se o caminho está correto e completo
- Confirme que o arquivo server.js foi enviado
- Use o caminho absoluto começando com `/home/`

### Erro: "dist/main.js não encontrado"
**Solução:**
- Execute `npm run build` localmente antes de fazer upload
- Certifique-se de que a pasta `dist/` completa foi enviada
- Verifique se `dist/main.js` existe no servidor

### Erro: "Cannot find module"
**Solução:**
- Execute `npm install --production` no servidor
- Verifique se o `package.json` foi enviado
- Confirme que as dependências estão instaladas

---

## 📝 Notas Adicionais

- O **Caminho da Aplicação** afeta apenas como você acessa a aplicação via HTTP
- O **Script** é o arquivo que será executado para iniciar a aplicação
- A KingHost geralmente define a porta automaticamente via variável `PORT_SERVER`
- Você pode verificar a porta nos logs após iniciar a aplicação

