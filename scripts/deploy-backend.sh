#!/bin/bash

# Script de deploy do backend para KingHost
# Uso: ./scripts/deploy-backend.sh

set -e  # Para em caso de erro

echo "🚀 Iniciando preparação do backend para deploy na KingHost..."

# Verifica se está no diretório raiz
if [ ! -d "backend" ]; then
    echo "❌ Erro: Execute este script do diretório raiz do projeto"
    exit 1
fi

cd backend

echo "📦 Instalando dependências..."
npm install

echo "🔨 Compilando projeto..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Erro: Pasta dist/ não foi criada. Verifique os erros de compilação."
    exit 1
fi

if [ ! -f "dist/main.js" ]; then
    echo "❌ Erro: Arquivo dist/main.js não foi criado."
    exit 1
fi

echo "✅ Build concluído com sucesso!"
echo ""
echo "📋 Arquivos prontos para upload:"
echo "   - server.js"
echo "   - package.json"
echo "   - package-lock.json"
echo "   - dist/ (pasta completa)"
echo ""
echo "⚠️  Lembre-se de:"
echo "   1. Criar o arquivo .env no servidor com as variáveis de ambiente"
echo "   2. Executar 'npm install --production' no servidor"
echo "   3. Executar as migrations do banco de dados"
echo "   4. Criar o usuário admin"
echo ""
echo "📖 Consulte GUIA_PUBLICACAO_KINGHOST.md para mais detalhes"







