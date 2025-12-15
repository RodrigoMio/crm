#!/bin/bash
# Script de setup para Linux/Mac
# Execute: chmod +x setup.sh && ./setup.sh

echo "🚀 Configurando projeto CRM..."

# Verificar se Node.js está instalado
echo ""
echo "📦 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale em: https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js encontrado: $(node --version)"

# Instalar dependências
echo ""
echo "📦 Instalando dependências do backend..."
cd backend
if [ -d "node_modules" ]; then
    echo "⚠️  node_modules já existe. Pulando instalação..."
else
    npm install
fi

echo ""
echo "📦 Instalando dependências do frontend..."
cd ../frontend
if [ -d "node_modules" ]; then
    echo "⚠️  node_modules já existe. Pulando instalação..."
else
    npm install
fi

cd ..

# Criar arquivo .env se não existir
echo ""
echo "⚙️  Configurando variáveis de ambiente..."
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo "✅ Arquivo .env criado a partir do .env.example"
        echo "⚠️  IMPORTANTE: Edite backend/.env e configure sua senha do PostgreSQL!"
    else
        echo "⚠️  Arquivo .env.example não encontrado. Crie manualmente o arquivo backend/.env"
    fi
else
    echo "✅ Arquivo .env já existe"
fi

echo ""
echo "✅ Setup concluído!"
echo ""
echo "📝 Próximos passos:"
echo "1. Configure o arquivo backend/.env com suas credenciais do PostgreSQL"
echo "2. Crie o banco de dados: CREATE DATABASE crm_leads;"
echo "3. Execute a migration: psql -U postgres -d crm_leads -f backend/src/migrations/001-create-tables.sql"
echo "4. Inicie o backend: cd backend && npm run start:dev"
echo "5. Inicie o frontend: cd frontend && npm run dev"





