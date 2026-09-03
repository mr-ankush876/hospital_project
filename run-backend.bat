@echo off
title VitalSync HMS - Backend Server (Port 8080)
color 0B
echo ========================================================
echo   VitalSync HMS - Starting Spring Boot Backend Server
echo ========================================================
echo.

cd /d "%~dp0backend"

:: Check if Java is installed (prefer JDK 17 from .tools if present)
if exist "%USERPROFILE%\.tools\jdk-17*\bin\java.exe" (
    for /d %%i in ("%USERPROFILE%\.tools\jdk-17*") do (
        set "JAVA_HOME=%%i"
        set "PATH=%%i\bin;%PATH%"
    )
) else (
    where java >nul 2>nul
    if %errorlevel% neq 0 (
        echo [ERROR] Java 17 or higher is not found on your system!
        echo Please install OpenJDK 17 or Oracle JDK 17:
        echo Download: https://adoptium.net/temurin/releases/?version=17
        echo.
        pause
        exit /b 1
    )
)

:: Load environment variables from root .env if present
if exist "%~dp0.env" (
    for /f "usebackq tokens=1* delims==" %%A in ("%~dp0.env") do (
        if not "%%A"=="" (
            set "%%A=%%B"
        )
    )
)

:: If DB_PASSWORD is still unset, provide the local default
if "%DB_PASSWORD%"=="" (
    set "DB_PASSWORD=Ankush143@"
)

echo [*] Starting Spring Boot on http://localhost:8080 (MySQL Profile) ...
call mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=mysql" "-Dspring.datasource.password=%DB_PASSWORD%"
if %errorlevel% neq 0 (
    echo.
    echo [INFO] Attempting fallback to dev profile (Embedded H2 DB)...
    call mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
    if %errorlevel% neq 0 (
        echo [ERROR] Backend failed to start.
        pause
    )
)
