# 🔧 Correção - Arquivos JS/CSS Retornando 404

## 🔍 DIAGNÓSTICO

Pelos logs e imagens:
- ✅ Backend está rodando na porta 21008
- ✅ Arquivos do frontend estão em `/apps_nodejs/crm/frontend/dist/assets/`
- ❌ Navegador tenta acessar `/assets/index-42d5d3d6.js` e retorna 404

**Problema:** O backend não está encontrando/servindo os arquivos estáticos corretamente.

---

## ✅ SOLUÇÃO RÁPIDA (3 Passos)

### 1️⃣ Verificar/Atualizar `.env`

Via SSH ou gerenciador de arquivos, edite `/apps_nodejs/crm/.env`:

```env
# Caminho absoluto do frontend (AJUSTE CONFORME SEU CASO)
FRONTEND_DIST_PATH=/apps_nodejs/crm/frontend/dist
```

**OU se o caminho completo for diferente:**

```env
FRONTEND_DIST_PATH=/home/crmcc/apps_nodejs/crm/frontend/dist
```

**⚠️ IMPORTANTE:** 
- Use o caminho **absoluto completo**
- O caminho deve apontar para a pasta que contém `index.html` e `assets/`

---

### 2️⃣ Verificar Estrutura de Arquivos

Via SSH, verifique se os arquivos estão no lugar certo:

```bash
# Verificar se index.html existe
ls -la /apps_nodejs/crm/frontend/dist/index.html

# Verificar se assets existe
ls -la /apps_nodejs/crm/frontend/dist/assets/

# Verificar se os arquivos JS e CSS estão lá
ls -la /apps_nodejs/crm/frontend/dist/assets/*.js
ls -la /apps_nodejs/crm/frontend/dist/assets/*.css
```

**Estrutura esperada:**
```
/apps_nodejs/crm/frontend/dist/
├── index.html
└── assets/
    ├── index-42d5d3d6.js
    └── index-7f873524.css
```

---

### 3️⃣ Reiniciar Backend e Verificar Logs

```bash
# Reiniciar PM2
pm2 restart crm

# Verificar logs (procure pela mensagem de frontend encontrado)
pm2 logs crm --lines 50
```

**✅ Log esperado:**
```
✅ Frontend encontrado em: /apps_nodejs/crm/frontend/dist
🌐 Frontend disponível em http://localhost:21008/
```

**❌ Se aparecer:**
```
⚠️ Frontend não encontrado. Apenas a API estará disponível.
```

Significa que o caminho está errado. Continue para o passo 4.

---

## 🔍 PASSO 4: Diagnosticar Caminho Correto

### Opção A: Verificar Caminho Absoluto Real

```bash
# Descobrir o caminho absoluto real
cd /apps_nodejs/crm/frontend/dist
pwd

# Verificar se index.html existe
ls -la index.html
```

**Use o resultado de `pwd` no `.env`:**

```env
FRONTEND_DIST_PATH=<resultado_do_pwd>
```

### Opção B: Verificar Logs Detalhados

O backend lista todos os caminhos que tentou. Verifique os logs:

```bash
pm2 logs crm | grep "Caminhos verificados"
```

Isso mostrará todos os caminhos que o backend tentou.

---

## 🎯 SOLUÇÃO ALTERNATIVA: Mover Frontend para `/www/`

Se preferir usar a estrutura padrão da KingHost:

### 1. Mover arquivos para `/www/`

```bash
# Copiar arquivos do frontend para /www/
cp -r /apps_nodejs/crm/frontend/dist/* /www/

# OU se preferir mover (remove da origem)
mv /apps_nodejs/crm/frontend/dist/* /www/
```

### 2. Atualizar `.env`

```env
FRONTEND_DIST_PATH=/www
```

### 3. Reiniciar

```bash
pm2 restart crm
```

---

## 📋 CHECKLIST COMPLETO

- [ ] Verificou estrutura de arquivos (`index.html` e `assets/` existem)
- [ ] Atualizou `.env` com `FRONTEND_DIST_PATH` correto (caminho absoluto)
- [ ] Reiniciou o backend (`pm2 restart crm`)
- [ ] Verificou logs e viu "Frontend encontrado"
- [ ] Testou no navegador e os arquivos JS/CSS carregam

---

## 🐛 SE AINDA NÃO FUNCIONAR

### Verificar Permissões

```bash
# Dar permissões de leitura
chmod -R 755 /apps_nodejs/crm/frontend/dist
chmod 644 /apps_nodejs/crm/frontend/dist/index.html
chmod 644 /apps_nodejs/crm/frontend/dist/assets/*
```

### Verificar se Backend Está Servindo Arquivos

Teste diretamente:

```bash
# Via curl (substitua 21008 pela sua porta)
curl http://localhost:21008/assets/index-42d5d3d6.js

# Se retornar 404, o backend não está servindo corretamente
# Se retornar o conteúdo do arquivo, está funcionando
```

### Verificar Configuração do useStaticAssets

O backend usa `app.useStaticAssets()` com `prefix: '/'`. Isso significa que:
- Arquivo em: `/apps_nodejs/crm/frontend/dist/assets/index.js`
- Deve ser acessível em: `http://localhost:21008/assets/index.js`

Se isso não funcionar, pode ser um problema de configuração do NestJS.

---

## 💡 DICA: Verificar Caminho no Código

Se quiser ver exatamente qual caminho o backend está usando, adicione um log temporário no `main.ts`:

```typescript
console.log('🔍 DEBUG - FRONTEND_DIST_PATH:', process.env.FRONTEND_DIST_PATH);
console.log('🔍 DEBUG - process.cwd():', process.cwd());
console.log('🔍 DEBUG - __dirname:', __dirname);
```

Recompile e faça upload novamente:

```powershell
cd backend
npm run build
```

Depois faça upload da pasta `dist/` e verifique os logs.

---

## 📞 PRÓXIMOS PASSOS

1. Execute os passos 1-3 acima
2. Verifique os logs do PM2
3. Se ainda não funcionar, execute o diagnóstico do passo 4
4. Compartilhe os logs para análise mais detalhada






