@echo off
title VitalSync HMS - One-Click Launcher
color 0E
cls
echo =========================================================================
echo              🏥 VitalSync Hospital Management System (HMS)
echo                  One-Click Fullstack Application Launcher
echo =========================================================================
echo.

cd /d "%~dp0"

:: 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is NOT installed on this computer!
    echo Node.js is required to run the frontend.
    echo.
    echo Please download and install Node.js (LTS version):
    echo -> https://nodejs.org/
    echo.
    echo After installing Node.js, double-click this file again.
    echo =========================================================================
    pause
    exit /b 1
)

:: 2. Check Java
set "JAVA_FOUND=0"
where java >nul 2>nul
if %errorlevel% equ 0 (
    set "JAVA_FOUND=1"
) else (
    if exist "%USERPROFILE%\.tools\jdk-17*\bin\java.exe" (
        set "JAVA_FOUND=1"
    )
)

if "%JAVA_FOUND%"=="0" (
    echo [ERROR] Java (JDK 17 or higher) is NOT installed on this computer!
    echo Java is required to run the Spring Boot backend.
    echo.
    echo Please download and install OpenJDK 17:
    echo -> https://adoptium.net/temurin/releases/?version=17
    echo (Choose Windows x64 .msi installer and make sure "Set JAVA_HOME" is checked)
    echo.
    echo Alternatively, run setup_tools.ps1 in PowerShell to download portable tools.
    echo =========================================================================
    pause
    exit /b 1
)

:: 3. Check and install npm dependencies
if not exist "node_modules\" (
    echo [1/3] Installing frontend dependencies (npm install)...
    echo       Please wait, this is only needed on the first run...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed. Please check your internet connection.
        pause
        exit /b 1
    )
    echo [OK] Frontend dependencies installed successfully.
    echo.
) else (
    echo [1/3] Frontend dependencies already installed.
)

:: 4. Start Spring Boot Backend in a separate window
echo [2/3] Launching Spring Boot Backend on http://localhost:8080 ...
start "VitalSync HMS - Backend Server (Port 8080)" cmd /k "cd /d ""%~dp0"" && call run-backend.bat"

:: 5. Start Vite Frontend in a separate window
echo [3/3] Launching Vite React Frontend on http://localhost:5173 ...
start "VitalSync HMS - Frontend Server (Port 5173)" cmd /k "cd /d ""%~dp0"" && npm run dev"

echo.
echo =========================================================================
echo  [SUCCESS] Both Backend and Frontend servers are starting up!
echo =========================================================================
echo.
echo  Backend:   http://localhost:8080  (Spring Boot REST API)
echo  Frontend:  http://localhost:5173  (React Web UI)
echo  H2 Console: http://localhost:8080/h2-console  (Dev Profile)
echo.
echo  Default Login Credentials:
echo  -------------------------------------------------------------
echo  * ADMIN:        ankush_876   / Ankush143@
echo  * DOCTOR:       dr.chen      / password123
echo  * RECEPTIONIST: receptionist / password123
echo  -------------------------------------------------------------
echo.
echo  Opening http://localhost:5173 in your default browser in 5 seconds...
echo.
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo Servers are running in the background windows.
echo Keep those windows open while using the application.
echo To stop the servers, simply close the opened command prompt windows.
echo =========================================================================
pause
