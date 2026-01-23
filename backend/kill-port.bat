@echo off
REM Script para encerrar processos usando a porta 3001
REM Uso: kill-port.bat

echo 🔍 Procurando processos na porta 3001...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    echo ❌ Encerrando processo PID: %%a
    taskkill /PID %%a /F >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  Não foi possível encerrar o processo %%a
    ) else (
        echo ✅ Processo encerrado!
    )
)

echo.
echo 💡 Dica: Use este script antes de iniciar o servidor se encontrar erro EADDRINUSE
pause


