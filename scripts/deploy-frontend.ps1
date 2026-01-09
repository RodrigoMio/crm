# Script de deploy do frontend para produção (PowerShell)
# Uso: .\scripts\deploy-frontend.ps1 [API_URL]
# Exemplo: .\scripts\deploy-frontend.ps1 https://api.seudominio.com

param(
    [string]$ApiUrl = ""
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Iniciando preparação do frontend para deploy..." -ForegroundColor Cyan

# Verifica se está no diretório raiz
if (-not (Test-Path "frontend")) {
    Write-Host "❌ Erro: Execute este script do diretório raiz do projeto" -ForegroundColor Red
    exit 1
}

Set-Location frontend

Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
npm install

# Cria arquivo .env.production se API_URL foi fornecido
if ($ApiUrl) {
    Write-Host "📝 Configurando API URL: $ApiUrl" -ForegroundColor Yellow
    "VITE_API_URL=$ApiUrl" | Out-File -FilePath ".env.production" -Encoding utf8
    Write-Host "✅ Arquivo .env.production criado" -ForegroundColor Green
} else {
    Write-Host "⚠️  API_URL não fornecido. Usando configuração padrão." -ForegroundColor Yellow
    Write-Host "   Para configurar, execute: .\scripts\deploy-frontend.ps1 https://seu-backend.com" -ForegroundColor Yellow
}

Write-Host "🔨 Compilando projeto para produção..." -ForegroundColor Yellow
npm run build

if (-not (Test-Path "dist")) {
    Write-Host "❌ Erro: Pasta dist/ não foi criada. Verifique os erros de compilação." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "dist/index.html")) {
    Write-Host "❌ Erro: Arquivo dist/index.html não foi criado." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build concluído com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Arquivos prontos para upload (pasta frontend/dist/):" -ForegroundColor Cyan
Write-Host "   - index.html"
Write-Host "   - assets/ (pasta completa)"
Write-Host ""
Write-Host "⚠️  Lembre-se de:" -ForegroundColor Yellow
Write-Host "   1. Fazer upload de TODOS os arquivos da pasta dist/ para o servidor web"
Write-Host "   2. Configurar o servidor web para servir index.html em todas as rotas (SPA)"
Write-Host "   3. Verificar se a URL da API está correta"
Write-Host ""
Write-Host "📖 Consulte GUIA_PUBLICACAO_KINGHOST.md para mais detalhes" -ForegroundColor Cyan

Set-Location ..







