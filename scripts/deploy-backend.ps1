# Script de deploy do backend para KingHost (PowerShell)
# Uso: .\scripts\deploy-backend.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Iniciando preparação do backend para deploy na KingHost..." -ForegroundColor Cyan

# Verifica se está no diretório raiz
if (-not (Test-Path "backend")) {
    Write-Host "❌ Erro: Execute este script do diretório raiz do projeto" -ForegroundColor Red
    exit 1
}

Set-Location backend

Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
npm install

Write-Host "🔨 Compilando projeto..." -ForegroundColor Yellow
npm run build

if (-not (Test-Path "dist")) {
    Write-Host "❌ Erro: Pasta dist/ não foi criada. Verifique os erros de compilação." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "dist/main.js")) {
    Write-Host "❌ Erro: Arquivo dist/main.js não foi criado." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build concluído com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Arquivos prontos para upload:" -ForegroundColor Cyan
Write-Host "   - server.js"
Write-Host "   - package.json"
Write-Host "   - package-lock.json"
Write-Host "   - dist/ (pasta completa)"
Write-Host ""
Write-Host "⚠️  Lembre-se de:" -ForegroundColor Yellow
Write-Host "   1. Criar o arquivo .env no servidor com as variáveis de ambiente"
Write-Host "   2. Executar 'npm install --production' no servidor"
Write-Host "   3. Executar as migrations do banco de dados"
Write-Host "   4. Criar o usuário admin"
Write-Host ""
Write-Host "📖 Consulte GUIA_PUBLICACAO_KINGHOST.md para mais detalhes" -ForegroundColor Cyan

Set-Location ..










