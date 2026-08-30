@echo off
title VitalSync HMS - Requirements & Setup Installer
color 0B
echo =========================================================================
echo       🏥 VitalSync HMS - One-Click Requirements & Setup Installer
echo =========================================================================
echo.
echo [*] Starting automated installer...
echo [*] Checking and installing Node.js, Java JDK 17, Frontend NPM and Backend Maven packages...
echo.

cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-requirements.ps1"

echo.
echo =========================================================================
echo Installer finished. You can now run the app with 'start-windows.bat'!
echo =========================================================================
pause
