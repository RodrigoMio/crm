# Script para encerrar processos usando a porta 3001
# Uso: .\kill-port.ps1 [porta]
# Se não especificar porta, usa 3001

param(
    [int]$port = 3001
)

Write-Host "🔍 Procurando processos na porta $port..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    foreach ($pid in $processes) {
        $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "❌ Encerrando processo: $($process.ProcessName) (PID: $pid)" -ForegroundColor Red
            Stop-Process -Id $pid -Force
            Write-Host "✅ Processo encerrado!" -ForegroundColor Green
        }
    }
} else {
    Write-Host "✅ Nenhum processo encontrado na porta $port" -ForegroundColor Green
}

if ($processes) {
    Write-Host "`n💡 Processos encerrados. Agora você pode iniciar o servidor." -ForegroundColor Green
} else {
    Write-Host "`n💡 Porta $port está livre. Você pode iniciar o servidor." -ForegroundColor Green
}

