$toolsDir = "$env:USERPROFILE\.tools"
if (!(Test-Path $toolsDir)) {
    New-Item -ItemType Directory -Path $toolsDir -Force | Out-Null
}

$jdkZip = "$toolsDir\jdk17.zip"
$mvnZip = "$toolsDir\maven.zip"

$jdkUrl = "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.12%2B7/OpenJDK17U-jdk_x64_windows_hotspot_17.0.12_7.zip"
$mvnUrl = "https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip"

Write-Host "Downloading OpenJDK 17..."
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
(New-Object System.Net.WebClient).DownloadFile($jdkUrl, $jdkZip)

Write-Host "Extracting OpenJDK 17..."
Expand-Archive -Path $jdkZip -DestinationPath $toolsDir -Force
Remove-Item $jdkZip -Force

Write-Host "Downloading Maven 3.9.6..."
(New-Object System.Net.WebClient).DownloadFile($mvnUrl, $mvnZip)

Write-Host "Extracting Maven 3.9.6..."
Expand-Archive -Path $mvnZip -DestinationPath $toolsDir -Force
Remove-Item $mvnZip -Force

Write-Host "Setup completed successfully!"
