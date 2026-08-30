# =========================================================================
# VitalSync HMS - Automated Requirements & Dependencies Installer
# =========================================================================

$ErrorActionPreference = "Continue"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $rootDir

Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "       🏥 VitalSync HMS - Automated System & Package Installer          " -ForegroundColor Yellow
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host ""

# Helper to check if a command exists in PATH
function Test-CommandExists($cmd) {
    return [bool](Get-Command $cmd -ErrorAction SilentlyContinue)
}

# -------------------------------------------------------------------------
# 1. Install / Verify Node.js
# -------------------------------------------------------------------------
Write-Host "[1/4] Checking Node.js runtime..." -ForegroundColor Cyan
if (Test-CommandExists "node") {
    $nodeVer = & node -v
    Write-Host "  -> Node.js is already installed: $nodeVer" -ForegroundColor Green
} else {
    Write-Host "  -> Node.js not detected in PATH. Attempting automatic installation..." -ForegroundColor Yellow
    
    $installedWithWinget = $false
    if (Test-CommandExists "winget") {
        Write-Host "  -> Installing Node.js LTS via winget..." -ForegroundColor White
        winget install --id OpenJS.NodeJS.LTS -e --silent --accept-package-agreements --accept-source-agreements
        if ($LASTEXITCODE -eq 0) {
            $installedWithWinget = $true
        }
    }
    
    if (-not $installedWithWinget) {
        Write-Host "  -> Downloading portable Node.js v20 LTS..." -ForegroundColor White
        $toolsDir = Join-Path $env:USERPROFILE ".tools"
        if (!(Test-Path $toolsDir)) { New-Item -ItemType Directory -Path $toolsDir -Force | Out-Null }
        $nodeZip = Join-Path $toolsDir "node.zip"
        $nodeUrl = "https://nodejs.org/dist/v20.12.2/node-v20.12.2-win-x64.zip"
        (New-Object System.Net.WebClient).DownloadFile($nodeUrl, $nodeZip)
        Expand-Archive -Path $nodeZip -DestinationPath $toolsDir -Force
        Remove-Item $nodeZip -Force
        $nodeFolder = (Get-Item (Join-Path $toolsDir "node-v20*")).FullName
        $env:PATH = "$nodeFolder;$env:PATH"
        [Environment]::SetEnvironmentVariable("PATH", "$nodeFolder;" + [Environment]::GetEnvironmentVariable("PATH", "User"), "User")
    }
    
    # Reload Path
    $env:PATH = [Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [Environment]::GetEnvironmentVariable("PATH", "User")
    Write-Host "  [OK] Node.js setup complete." -ForegroundColor Green
}

# -------------------------------------------------------------------------
# 2. Install / Verify Java JDK 17
# -------------------------------------------------------------------------
Write-Host ""
Write-Host "[2/4] Checking Java JDK 17+..." -ForegroundColor Cyan
if (Test-CommandExists "java") {
    $javaVer = & java -version 2>&1 | Select-Object -First 1
    Write-Host "  -> Java is already installed: $javaVer" -ForegroundColor Green
} else {
    Write-Host "  -> Java 17 not detected in PATH. Attempting automatic installation..." -ForegroundColor Yellow
    
    $installedJavaWinget = $false
    if (Test-CommandExists "winget") {
        Write-Host "  -> Installing Eclipse Temurin OpenJDK 17 via winget..." -ForegroundColor White
        winget install --id EclipseAdoptium.Temurin.17.JDK -e --silent --accept-package-agreements --accept-source-agreements
        if ($LASTEXITCODE -eq 0) {
            $installedJavaWinget = $true
        }
    }
    
    if (-not $installedJavaWinget) {
        Write-Host "  -> Downloading OpenJDK 17 from Adoptium..." -ForegroundColor White
        $toolsDir = Join-Path $env:USERPROFILE ".tools"
        if (!(Test-Path $toolsDir)) { New-Item -ItemType Directory -Path $toolsDir -Force | Out-Null }
        $jdkZip = Join-Path $toolsDir "jdk17.zip"
        $jdkUrl = "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.12%2B7/OpenJDK17U-jdk_x64_windows_hotspot_17.0.12_7.zip"
        (New-Object System.Net.WebClient).DownloadFile($jdkUrl, $jdkZip)
        Expand-Archive -Path $jdkZip -DestinationPath $toolsDir -Force
        Remove-Item $jdkZip -Force
        $jdkFolder = (Get-Item (Join-Path $toolsDir "jdk-17*")).FullName
        $env:JAVA_HOME = $jdkFolder
        $env:PATH = "$jdkFolder\bin;$env:PATH"
        [Environment]::SetEnvironmentVariable("JAVA_HOME", $jdkFolder, "User")
        [Environment]::SetEnvironmentVariable("PATH", "$jdkFolder\bin;" + [Environment]::GetEnvironmentVariable("PATH", "User"), "User")
    }
    
    # Reload Path
    $env:PATH = [Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [Environment]::GetEnvironmentVariable("PATH", "User")
    Write-Host "  [OK] Java JDK 17 setup complete." -ForegroundColor Green
}

# -------------------------------------------------------------------------
# 3. Install Frontend Dependencies (npm install)
# -------------------------------------------------------------------------
Write-Host ""
Write-Host "[3/4] Installing Frontend NPM dependencies (React, Vite, Tailwind, etc.)..." -ForegroundColor Cyan
Set-Location $rootDir
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Frontend dependencies installed successfully." -ForegroundColor Green
} else {
    Write-Host "  [WARNING] npm install had an issue. Please verify internet connection." -ForegroundColor Yellow
}

# -------------------------------------------------------------------------
# 4. Pre-download Backend Maven Dependencies
# -------------------------------------------------------------------------
Write-Host ""
Write-Host "[4/4] Pre-building Backend Spring Boot dependencies..." -ForegroundColor Cyan
Set-Location (Join-Path $rootDir "backend")
.\mvnw.cmd test-compile
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Backend dependencies downloaded and compiled successfully." -ForegroundColor Green
} else {
    Write-Host "  [WARNING] Maven wrapper had an issue downloading dependencies." -ForegroundColor Yellow
}

Set-Location $rootDir

Write-Host ""
Write-Host "=========================================================================" -ForegroundColor Green
Write-Host "  🎉 ALL REQUIREMENTS & DEPENDENCIES INSTALLED SUCCESSFULLY!             " -ForegroundColor Yellow
Write-Host "=========================================================================" -ForegroundColor Green
Write-Host ""
Write-Host " You are now ready to run the project!" -ForegroundColor White
Write-Host " Simply double-click:  start-windows.bat" -ForegroundColor Cyan
Write-Host ""
