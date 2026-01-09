# 🔄 Como Atualizar Alterações de CSS na KingHost

Este guia explica o processo rápido para atualizar alterações em arquivos CSS na KingHost.

---

## 📋 Processo Completo

### 1️⃣ Fazer Build do Frontend (Local)

Como você alterou um arquivo CSS (`LeadsList.css`), é necessário recompilar o frontend. O Vite processa e minifica os arquivos CSS durante o build.

**Windows (PowerShell):**
```powershell
cd frontend
npm run build
```

**Verificar se o build foi bem-sucedido:**
```powershell
# Verificar se a pasta dist foi criada/atualizada
dir dist
```

---

### 2️⃣ Upload dos Arquivos Compilados

Após o build, você precisa fazer upload dos arquivos compilados para a KingHost.

#### 📦 Arquivos para Upload

Você precisa fazer upload de **TODOS os arquivos** da pasta `frontend/dist/` para `/www/` no servidor da KingHost:

- ✅ `frontend/dist/index.html` → `/www/index.html`
- ✅ `frontend/dist/assets/` (pasta completa) → `/www/assets/`
- ✅ Todos os outros arquivos de `frontend/dist/` → `/www/`

**⚠️ IMPORTANTE:** 
- O arquivo CSS será processado pelo Vite e estará dentro de `frontend/dist/assets/` com um nome como `index-[hash].css`
- Você deve fazer upload de **TODA a pasta `assets/`**, não apenas arquivos específicos

---

### 3️⃣ Métodos de Upload

Escolha um dos métodos abaixo:

#### Método 1: Gerenciador de Arquivos (Painel Web) ⭐ Recomendado

1. Acesse o painel da KingHost
2. Navegue até "Gerenciador de Arquivos"
3. Vá para o diretório `/www/`
4. Faça upload dos arquivos:
   - `index.html` (sobrescrever o existente)
   - Pasta `assets/` completa (sobrescrever a pasta existente)

**💡 Dica:** Se for muitos arquivos, compacte em ZIP, faça upload e extraia no servidor.

#### Método 2: FTP/SFTP

1. Conecte via FileZilla, WinSCP ou similar
2. Navegue até `/www/`
3. Faça upload de todos os arquivos de `frontend/dist/` mantendo a estrutura

#### Método 3: SSH/SCP

```bash
# Compactar localmente (no diretório frontend/)
tar -czf dist.tar.gz dist/

# Enviar para servidor
scp dist.tar.gz usuario@kinghost.net:/www/

# Conectar e extrair
ssh usuario@kinghost.net
cd /www
tar -xzf dist.tar.gz --strip-components=1
rm dist.tar.gz
```

---

## ⚡ Processo Rápido (Comandos Completos)

### Windows (PowerShell):
```powershell
# 1. Build
cd frontend
npm run build

# 2. Verificar
dir dist

# 3. Fazer upload via FTP/Gerenciador de Arquivos
#    Upload de: frontend/dist/* → /www/ no servidor
```

---

## ✅ Verificação

Após o upload:

1. **Acesse o site no navegador**
2. **Pressione Ctrl+Shift+R** (ou Cmd+Shift+R no Mac) para forçar atualização do cache
3. **Verifique se as alterações CSS foram aplicadas**

**💡 Dica:** O navegador pode fazer cache dos arquivos CSS. Use Ctrl+Shift+R para forçar atualização ou abra em modo anônimo.

---

## 🐛 Problemas Comuns

### Problema: Alterações não aparecem no navegador

**Causa:** Cache do navegador ou arquivos não foram atualizados corretamente.

**Solução:**
1. Limpe o cache do navegador (Ctrl+Shift+Del)
2. Ou use Ctrl+Shift+R para recarregar forçando atualização
3. Ou abra em modo anônimo/privado
4. Verifique se os arquivos foram realmente atualizados no servidor

### Problema: Erro 404 nos arquivos CSS

**Causa:** Estrutura de pastas incorreta ou arquivos não foram enviados.

**Solução:**
1. Verifique se a pasta `assets/` existe em `/www/`
2. Verifique se os arquivos CSS estão dentro de `/www/assets/`
3. Faça upload novamente de toda a pasta `dist/`

---

## 📝 Resumo

1. ✅ Execute `npm run build` no diretório `frontend/`
2. ✅ Faça upload de **TODOS os arquivos** de `frontend/dist/` para `/www/` na KingHost
3. ✅ Limpe o cache do navegador (Ctrl+Shift+R)
4. ✅ Verifique se as alterações foram aplicadas

---

## ⚠️ Lembrete

- **Sempre faça build** antes de fazer upload (o CSS fonte não é usado em produção)
- Faça upload de **todos os arquivos** de `dist/`, não apenas o CSS
- O Vite gera nomes de arquivo com hash (ex: `index-abc123.css`), então você precisa atualizar todos os assets
