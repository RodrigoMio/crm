# 🔧 Solução: Sem Permissão para Configurar Proxy Reverso

## ❌ Problema

- Não tem permissão para criar arquivos de configuração do Apache
- Não pode configurar proxy reverso via arquivos `.conf` ou `.htaccess`
- Frontend não consegue se conectar ao backend (timeout)

## ✅ Soluções Alternativas

### **OPÇÃO 1: Contatar Suporte KingHost (Recomendado)**

A KingHost pode configurar o proxy reverso para você. Entre em contato com o suporte e peça:

**Mensagem para o suporte:**
```
Olá, preciso configurar um proxy reverso no Apache para minha aplicação Node.js.

Preciso que todas as requisições para /api sejam redirecionadas para:
http://localhost:21008/api

A aplicação Node.js está rodando na porta 21008 e precisa que o Apache faça 
proxy reverso das requisições /api para essa porta.

Pode me ajudar a configurar isso?
```

---

### **OPÇÃO 2: Modificar Frontend para Usar URL Completa do Backend**

Se a porta 21008 for acessível externamente, podemos fazer o frontend acessar diretamente.

#### Passo 1: Verificar se a porta é acessível

Teste no navegador:
```
http://www.crmcc.kinghost.net:21008/api/
```

**Se funcionar:** A porta é acessível externamente ✅  
**Se não funcionar:** A porta não é acessível, use outra opção ❌

#### Passo 2: Modificar frontend para usar URL completa

Vou modificar o `api.ts` para detectar automaticamente ou usar variável de ambiente.

---

### **OPÇÃO 3: Servir Frontend pelo NestJS (Tudo na Porta 21008)**

O NestJS já está configurado para servir o frontend. Podemos fazer tudo rodar na porta 21008.

**Vantagem:** Não precisa de proxy reverso  
**Desvantagem:** Precisa configurar o domínio para apontar para a porta 21008 (pode não ser possível na KingHost)

---

### **OPÇÃO 4: Usar Subdomínio ou Caminho Alternativo**

Se a KingHost permitir, você pode:
- Criar um subdomínio que aponte diretamente para a porta 21008
- Exemplo: `api.crmcc.kinghost.net` → porta 21008

---

## 🎯 Solução Imediata: Modificar Frontend

Modifiquei o código do frontend para tentar usar a porta 21008 diretamente. Agora você tem 3 opções:

### **OPÇÃO A: Usar Porta Direta (Já Implementado)**

O frontend agora tenta acessar diretamente a porta 21008:
```
https://www.crmcc.kinghost.net:21008/api
```

**Teste primeiro:**
1. Acesse no navegador: `http://www.crmcc.kinghost.net:21008/api/`
2. Se retornar 404 (não timeout), a porta é acessível ✅
3. Recompile o frontend e faça upload novamente

**Se funcionar:** Pronto! Não precisa fazer mais nada.  
**Se não funcionar:** A porta não é acessível externamente, use a OPÇÃO B ou C.

---

### **OPÇÃO B: Configurar Variável de Ambiente VITE_API_URL**

Se a porta não for acessível, você pode configurar a URL completa via variável de ambiente.

#### Passo 1: Criar arquivo `.env` no frontend (local)

```bash
cd frontend
nano .env
```

**Conteúdo:**
```env
# URL completa da API (com porta se necessário)
VITE_API_URL=https://www.crmcc.kinghost.net:21008
```

#### Passo 2: Recompilar frontend

```powershell
cd frontend
npm run build
```

#### Passo 3: Fazer upload do `frontend/dist/` atualizado

---

### **OPÇÃO C: Contatar Suporte KingHost (Mais Confiável)**

Se nenhuma das opções acima funcionar, contate o suporte da KingHost e peça para configurar o proxy reverso.

**Mensagem para o suporte:**
```
Olá, preciso configurar um proxy reverso no Apache para minha aplicação Node.js.

Preciso que todas as requisições para /api sejam redirecionadas para:
http://localhost:21008/api

A aplicação Node.js está rodando na porta 21008 e precisa que o Apache faça 
proxy reverso das requisições /api para essa porta.

Pode me ajudar a configurar isso? Não tenho permissão para criar arquivos 
de configuração do Apache.
```

---

## 📋 Passos para Testar

### 1. Testar se a porta 21008 é acessível

**No navegador, acesse:**
```
http://www.crmcc.kinghost.net:21008/api/
```

**Resultados possíveis:**
- ✅ **404 Not Found**: Porta é acessível! Use a OPÇÃO A (já implementada)
- ❌ **Timeout/Connection Refused**: Porta não é acessível, use OPÇÃO B ou C

### 2. Se a porta for acessível

1. Recompilar frontend:
```powershell
cd frontend
npm run build
```

2. Fazer upload do `frontend/dist/` atualizado

3. Testar login no frontend

### 3. Se a porta NÃO for acessível

**Use OPÇÃO B** (variável de ambiente) ou **OPÇÃO C** (contatar suporte).

---

## 🔧 Como Funciona Agora

O frontend tenta usar a URL nesta ordem:

1. **Variável de ambiente `VITE_API_URL`** (se definida)
2. **Porta direta**: `https://www.crmcc.kinghost.net:21008/api`
3. **Proxy reverso**: `https://www.crmcc.kinghost.net/api` (fallback)

---

## ✅ Checklist

- [ ] Testar se porta 21008 é acessível: `http://www.crmcc.kinghost.net:21008/api/`
- [ ] Se acessível: Recompilar frontend e fazer upload
- [ ] Se não acessível: Configurar `VITE_API_URL` ou contatar suporte
- [ ] Testar login no frontend
- [ ] Verificar logs do backend: `pm2 logs crm`

