# ⚠️ Problema: Versão do Node.js

## 🔴 Problema Identificado

Você está usando **Node.js 14.18.1**, mas o projeto requer **Node.js 16.0.0 ou superior**.

As dependências que requerem Node.js 16+:
- `pg@8.16.3` requer Node.js >= 16.0.0
- `typeorm@0.3.28` requer Node.js >= 16.13.0

## ✅ Solução Recomendada: Atualizar Node.js

### Opção 1: Usar NVM (Node Version Manager) - Recomendado

**Windows:**
1. Instale o NVM para Windows: https://github.com/coreybutler/nvm-windows/releases
2. Instale Node.js 18 LTS:
   ```powershell
   nvm install 18
   nvm use 18
   ```
3. Verifique:
   ```powershell
   node --version
   # Deve mostrar: v18.x.x
   ```

**Linux/Mac:**
```bash
# Instalar nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Instalar Node.js 18
nvm install 18
nvm use 18

# Verificar
node --version
```

### Opção 2: Instalar Node.js 18 LTS Diretamente

1. Baixe Node.js 18 LTS: https://nodejs.org/
2. Instale seguindo o assistente
3. Reinicie o terminal
4. Verifique:
   ```powershell
   node --version
   # Deve mostrar: v18.x.x
   ```

## 🔧 Solução Alternativa: Ajustar Versões (Não Recomendado)

Se não puder atualizar o Node.js agora, ajustei algumas versões no `package.json` para compatibilidade com Node 14, mas **isso pode causar problemas futuros**.

Após atualizar o Node.js ou ajustar as versões, execute:

```powershell
cd C:\Users\rjmio\projetos-cursor\CRM\backend
npm install
```

## 📋 Checklist

- [ ] Atualizar Node.js para versão 18 LTS
- [ ] Verificar versão: `node --version`
- [ ] Limpar cache: `npm cache clean --force`
- [ ] Remover node_modules: `Remove-Item -Recurse -Force node_modules`
- [ ] Remover package-lock.json: `Remove-Item package-lock.json`
- [ ] Reinstalar: `npm install`

## 🎯 Versão Mínima Recomendada

- **Node.js**: 18.x LTS (ou 16.x mínimo)
- **npm**: 8.x ou superior



