# 🔨 Comandos para Build do Frontend

## ✅ Passos Recomendados

### 1. Excluir pasta `dist` antiga (Recomendado)

**Windows (PowerShell):**
```powershell
cd frontend
Remove-Item -Recurse -Force dist
```

**Windows (CMD):**
```cmd
cd frontend
rmdir /s /q dist
```

**Linux/Mac:**
```bash
cd frontend
rm -rf dist
```

### 2. Criar/Atualizar `.env.production`

**Windows (PowerShell):**
```powershell
# Se usar HTTP
echo "VITE_API_URL=http://www.crmcc.kinghost.net:21008" > .env.production

# Se usar HTTPS
# echo "VITE_API_URL=https://www.crmcc.kinghost.net:21008" > .env.production
```

**Linux/Mac:**
```bash
# Se usar HTTP
echo "VITE_API_URL=http://www.crmcc.kinghost.net:21008" > .env.production

# Se usar HTTPS
# echo "VITE_API_URL=https://www.crmcc.kinghost.net:21008" > .env.production
```

### 3. Fazer Build

```bash
npm run build
```

### 4. Verificar se foi gerado corretamente

**Windows:**
```powershell
dir dist
```

**Linux/Mac:**
```bash
ls -la dist/
```

**Deve mostrar:**
- `index.html`
- `assets/` (pasta com arquivos JS e CSS)

---

## 🎯 Comandos Completos (Copiar e Colar)

### Windows (PowerShell):
```powershell
cd frontend
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
echo "VITE_API_URL=http://www.crmcc.kinghost.net:21008" > .env.production
npm run build
dir dist
```

### Linux/Mac:
```bash
cd frontend
rm -rf dist
echo "VITE_API_URL=http://www.crmcc.kinghost.net:21008" > .env.production
npm run build
ls -la dist/
```

---

## ⚠️ Importante

1. **Sempre exclua `dist` antes de fazer build** para garantir arquivos limpos
2. **Verifique o protocolo** (http ou https) antes de criar `.env.production`
3. **Use o mesmo hostname** (com ou sem www) que aparece na barra de endereço
4. **Sempre inclua a porta** `:21008`

---

## ✅ Após Build

Faça upload de **TODOS os arquivos** de `frontend/dist/` para `/home/crmcc/www/` no servidor.







