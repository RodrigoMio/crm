# 📦 Arquivos para Atualizar no Servidor

## 🔄 Resumo das Alterações

Foram feitas alterações em:
1. ✅ **frontend/src/main.tsx** - Configuração React Query (cache)
2. ✅ **frontend/.htaccess** - Headers Cache-Control para API
3. ✅ **frontend/src/pages/KanbanColaborador.tsx** - Lógica de exibição e invalidação
4. ✅ **frontend/src/pages/KanbanAdmin.tsx** - Invalidação de queries
5. ✅ **frontend/src/pages/KanbanAgente.tsx** - Invalidação de queries

---

## 📋 Passo a Passo

### 1️⃣ Fazer Build do Frontend (Local)

**Windows (PowerShell):**
```powershell
cd frontend
npm run build
```

**Linux/Mac:**
```bash
cd frontend
npm run build
```

Isso vai compilar todos os arquivos TypeScript/TSX e gerar arquivos JavaScript na pasta `frontend/dist/`.

---

### 2️⃣ Arquivos para Upload no Servidor

#### ✅ Pasta `frontend/dist/` (COMPLETA)

**Origem:** `C:\Users\rjmio\projetos-cursor\CRM\frontend\dist\`

**Destino no servidor:** `/home/crmcc/www/` (ou pasta web configurada)

**Arquivos que devem ser enviados:**
- ✅ `index.html` (atualizado com as novas configurações)
- ✅ `assets/` (pasta completa)
  - Arquivos JavaScript compilados (incluem mudanças do React Query)
  - Arquivos CSS
  - Outros assets

**⚠️ IMPORTANTE:** Envie **TODA a pasta `dist/`** para o servidor, substituindo os arquivos antigos.

---

#### ✅ Arquivo `.htaccess` (CRÍTICO)

**Origem:** `C:\Users\rjmio\projetos-cursor\CRM\frontend\.htaccess`

**Destino no servidor:** `/home/crmcc/www/.htaccess`

**Por quê:** Este arquivo contém as configurações de headers `Cache-Control` para desabilitar cache nas rotas `/api/*`. **Este arquivo é essencial** para resolver o problema de cache!

---

## 📁 Estrutura Final no Servidor

Após o upload, o servidor deve ter:

```
/home/crmcc/www/  (ou sua pasta web)
├── index.html              ✅ ATUALIZAR (vem de dist/)
├── .htaccess               ✅ ATUALIZAR (vem de frontend/.htaccess)
└── assets/                 ✅ ATUALIZAR (vem de dist/assets/)
    ├── index-xxxxx.js      (JavaScript compilado com as mudanças)
    ├── index-xxxxx.css
    └── ... (outros assets)
```

---

## 🚨 Comandos Completos (Copiar e Colar)

### Windows (PowerShell):

```powershell
# 1. Fazer build
cd frontend
npm run build

# 2. Verificar se foi gerado
dir dist

# 3. Fazer upload via FTP/SFTP:
#    - frontend/dist/* → /home/crmcc/www/
#    - frontend/.htaccess → /home/crmcc/www/.htaccess
```

### Linux/Mac:

```bash
# 1. Fazer build
cd frontend
npm run build

# 2. Verificar se foi gerado
ls -la dist/

# 3. Fazer upload via FTP/SFTP:
#    - frontend/dist/* → /home/crmcc/www/
#    - frontend/.htaccess → /home/crmcc/www/.htaccess
```

---

## ✅ Checklist de Upload

- [ ] Fazer build do frontend (`npm run build`)
- [ ] Verificar que a pasta `dist/` foi criada/atualizada
- [ ] Fazer upload de **TODOS os arquivos** de `frontend/dist/` para o servidor
- [ ] Fazer upload do arquivo `frontend/.htaccess` para o servidor
- [ ] Verificar permissões do `.htaccess` (644)
- [ ] Testar a aplicação no servidor

---

## 🔍 Verificações Pós-Upload

1. **Verificar headers HTTP:**
   - Abrir DevTools (F12) → Network
   - Fazer uma requisição para `/api/...`
   - Verificar que os headers `Cache-Control: no-cache, no-store, must-revalidate` estão presentes

2. **Testar movimentação de cards:**
   - Mover um card entre boards
   - Fazer ALT+TAB (sair e voltar)
   - Verificar que o card permanece no board correto

3. **Verificar console do navegador:**
   - Não deve haver erros relacionados a cache

---

## 📝 Notas Importantes

1. **NÃO precisa atualizar o backend** - Todas as mudanças foram apenas no frontend
2. **NÃO precisa reiniciar serviços** - Apenas fazer upload dos arquivos
3. **O arquivo `.htaccess` é crítico** - Sem ele, os headers de cache não funcionarão
4. **Sempre fazer backup** antes de substituir arquivos no servidor

---

## 🆘 Problemas Comuns

### Problema: Arquivos não atualizaram no servidor
- **Solução:** Limpar cache do navegador (Ctrl+Shift+Del) ou fazer hard refresh (Ctrl+F5)

### Problema: Headers Cache-Control não aparecem
- **Solução:** Verificar se o `.htaccess` foi enviado corretamente e se o módulo `mod_headers` está habilitado no Apache

### Problema: Erro 500 após upload
- **Solução:** Verificar permissões do `.htaccess` (deve ser 644) e sintaxe do arquivo

