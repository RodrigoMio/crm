# Script de setup para Windows PowerShell
# Execute: .\setup.ps1

Write-Host "🚀 Configurando projeto CRM..." -ForegroundColor Green

# Verificar se Node.js está instalado
Write-Host "`n📦 Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado. Instale em: https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Instalar dependências
Write-Host "`n📦 Instalando dependências do backend..." -ForegroundColor Yellow
Set-Location backend
if (Test-Path "node_modules") {
    Write-Host "⚠️  node_modules já existe. Pulando instalação..." -ForegroundColor Yellow
} else {
    npm install
}

Write-Host "`n📦 Instalando dependências do frontend..." -ForegroundColor Yellow
Set-Location ../frontend
if (Test-Path "node_modules") {
    Write-Host "⚠️  node_modules já existe. Pulando instalação..." -ForegroundColor Yellow
} else {
    npm install
}

Set-Location ..

# Criar arquivo .env se não existir
Write-Host "`n⚙️  Configurando variáveis de ambiente..." -ForegroundColor Yellow
if (-not (Test-Path "backend\.env")) {
    if (Test-Path "backend\.env.example") {
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "✅ Arquivo .env criado a partir do .env.example" -ForegroundColor Green
        Write-Host "⚠️  IMPORTANTE: Edite backend\.env e configure sua senha do PostgreSQL!" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  Arquivo .env.example não encontrado. Crie manualmente o arquivo backend\.env" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Arquivo .env já existe" -ForegroundColor Green
}

Write-Host "`n✅ Setup concluído!" -ForegroundColor Green
Write-Host "`n📝 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Configure o arquivo backend\.env com suas credenciais do PostgreSQL" -ForegroundColor White
Write-Host "2. Crie o banco de dados: CREATE DATABASE crm_leads;" -ForegroundColor White
Write-Host "3. Execute a migration: psql -U postgres -d crm_leads -f backend\src\migrations\001-create-tables.sql" -ForegroundColor White
Write-Host "4. Inicie o backend: cd backend && npm run start:dev" -ForegroundColor White
Write-Host "5. Inicie o frontend: cd frontend && npm run dev" -ForegroundColor White












