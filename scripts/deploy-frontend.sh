#!/bin/bash

# Script de deploy do frontend para produção
# Uso: ./scripts/deploy-frontend.sh [API_URL]
# Exemplo: ./scripts/deploy-frontend.sh https://api.seudominio.com

set -e  # Para em caso de erro

API_URL=${1:-""}

echo "🚀 Iniciando preparação do frontend para deploy..."

# Verifica se está no diretório raiz
if [ ! -d "frontend" ]; then
    echo "❌ Erro: Execute este script do diretório raiz do projeto"
    exit 1
fi

cd frontend

echo "📦 Instalando dependências..."
npm install

# Cria arquivo .env.production se API_URL foi fornecido
if [ -n "$API_URL" ]; then
    echo "📝 Configurando API URL: $API_URL"
    echo "VITE_API_URL=$API_URL" > .env.production
    echo "✅ Arquivo .env.production criado"
else
    echo "⚠️  API_URL não fornecido. Usando configuração padrão."
    echo "   Para configurar, execute: ./scripts/deploy-frontend.sh https://seu-backend.com"
fi

echo "🔨 Compilando projeto para produção..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Erro: Pasta dist/ não foi criada. Verifique os erros de compilação."
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "❌ Erro: Arquivo dist/index.html não foi criado."
    exit 1
fi

echo "✅ Build concluído com sucesso!"
echo ""
echo "📋 Arquivos prontos para upload (pasta frontend/dist/):"
echo "   - index.html"
echo "   - assets/ (pasta completa)"
echo ""
echo "⚠️  Lembre-se de:"
echo "   1. Fazer upload de TODOS os arquivos da pasta dist/ para o servidor web"
echo "   2. Configurar o servidor web para servir index.html em todas as rotas (SPA)"
echo "   3. Verificar se a URL da API está correta"
echo ""
echo "📖 Consulte GUIA_PUBLICACAO_KINGHOST.md para mais detalhes"










