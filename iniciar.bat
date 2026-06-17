@echo off
title PoE2 SyncCompanion Launcher
cls
echo ===================================================
echo             PoE2 SyncCompanion Launcher
echo ===================================================
echo.

:: Verifica se a pasta node_modules existe, senão instala
if not exist node_modules (
    echo [INFO] Pasta 'node_modules' nao encontrada. Instalando dependencias...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERRO] Falha ao instalar as dependencias. Verifique se o Node.js esta instalado.
        pause
        exit /b %errorlevel%
    )
)

:menu
echo Escolha uma opcao para iniciar:
echo.
echo [1] Iniciar App Completo (Tauri + React) [Recomendado]
echo [2] Iniciar apenas o Frontend (Navegador)
echo [3] Instalar/Atualizar Dependencias (npm install)
echo [4] Compilar Aplicativo (Build Production)
echo [5] Sair
echo.
set /p opcao="Escolha uma opcao (1-5): "

if "%opcao%"=="1" goto tauri_dev
if "%opcao%"=="2" goto web_dev
if "%opcao%"=="3" goto install_dep
if "%opcao%"=="4" goto build_app
if "%opcao%"=="5" goto exit_app
echo Opcao invalida. Tente novamente.
echo.
goto menu

:tauri_dev
echo.
echo Iniciando o aplicativo Tauri em modo desenvolvimento...
npm run tauri dev
pause
goto menu

:web_dev
echo.
echo Iniciando apenas o frontend no navegador...
npm run dev
pause
goto menu

:install_dep
echo.
echo Instalando dependencias do npm...
call npm install
echo Dependencias instaladas/atualizadas!
pause
goto menu

:build_app
echo.
echo Compilando aplicativo Tauri para producao...
npm run tauri build
pause
goto menu

:exit_app
exit
