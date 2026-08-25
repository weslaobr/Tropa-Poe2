@echo off
title Tropa PoE2 - Servidor de teste
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Node.js/npm nao encontrado no PATH.
    pause
    exit /b 1
)

if not exist node_modules (
    echo [1/2] Primeira execucao: instalando dependencias...
    call npm install
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar dependencias.
        pause
        exit /b 1
    )
)

echo.
echo ============================================
echo   TROPA POE2  ^|  http://localhost:3000
echo   Feche esta janela para parar o servidor
echo ============================================
echo.

start "" cmd /c "timeout /t 5 /nobreak >nul & start http://localhost:3000"

call npm run dev

echo.
echo Servidor finalizado.
pause
