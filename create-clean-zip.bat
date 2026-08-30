@echo off
title VitalSync HMS - Clean Zip Creator
color 0B
echo =========================================================================
echo       VitalSync HMS - Create Clean Zip for Sharing
echo =========================================================================
echo.
echo [*] Packaging project files (excluding heavy folders like node_modules and target)...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$dest = Join-Path (Get-Location) 'VitalSync_HMS_Shareable.zip';" ^
  "if (Test-Path $dest) { Remove-Item -Force $dest };" ^
  "$tempDir = Join-Path $env:TEMP ('vitalsync_pack_' + (Get-Random));" ^
  "New-Item -ItemType Directory -Path $tempDir | Out-Null;" ^
  "robocopy . $tempDir /E /XD node_modules target dist .git .idea .vscode /XF *.zip *.log *.rar /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null;" ^
  "Compress-Archive -Path (Join-Path $tempDir '*') -DestinationPath $dest -Force;" ^
  "Remove-Item -Recurse -Force $tempDir;" ^
  "Write-Host '[SUCCESS] Created clean zip file: VitalSync_HMS_Shareable.zip' -ForegroundColor Green;" ^
  "$size = (Get-Item $dest).Length / 1MB;" ^
  "Write-Host ('Size: ' + [math]::Round($size, 2) + ' MB (Ready to share with anyone!)') -ForegroundColor Yellow;"

echo.
echo =========================================================================
echo Now you can send 'VitalSync_HMS_Shareable.zip' to anyone!
echo =========================================================================
pause
