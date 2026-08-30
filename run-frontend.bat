@echo off
title VitalSync HMS - Frontend Server (Port 5173)
color 0A
echo ========================================================
echo   VitalSync HMS - Starting Vite React Frontend Server
echo ========================================================
echo.

cd /d "%~dp0"

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your system!
    echo Please install Node.js (v18 or higher):
    echo Download: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist "node_modules\" (
    echo [*] node_modules not found. Installing dependencies via npm install...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

echo [*] Starting Vite Frontend Server on http://localhost:5173 ...
call npm run dev
if %errorlevel% neq 0 (
    echo [ERROR] Frontend failed to start.
    pause
)
