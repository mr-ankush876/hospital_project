@REM ----------------------------------------------------------------------------
@REM Maven Wrapper Start Up Batch script
@REM ----------------------------------------------------------------------------

@if "%DEBUG%" == "" @echo off
@setlocal

set ERROR_CODE=0

@REM Set local scope for the variables with windows NT shell
if "%OS%"=="Windows_NT" @setlocal

@REM Enable location remembering
set MAVEN_BATCH_ECHO=off
if "%MAVEN_BATCH_ECHO%" == "on"  echo %MAVEN_BATCH_ECHO%

@REM set %~dp0 is the directory of this wizard script for Windows NT
set "MAVEN_HOME=%~dp0.mvn\wrapper"
set "MAVEN_PROJECTBASEDIR=%~dp0"
if "%MAVEN_PROJECTBASEDIR:~-1%"=="\" set "MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%"

@REM Maven Wrapper Jar
set "WRAPPER_JAR=%MAVEN_HOME%\maven-wrapper.jar"
set WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain

set DOWNLOAD_URL="https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar"

if exist "%WRAPPER_JAR%" goto find_java

echo Downloading %DOWNLOAD_URL%
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('%DOWNLOAD_URL%', '%WRAPPER_JAR%')"

:find_java
set "JAVACMD="

@REM 1. Try JAVA_HOME
if not "%JAVA_HOME%"=="" (
    if exist "%JAVA_HOME%\bin\java.exe" (
        set "JAVACMD=%JAVA_HOME%\bin\java.exe"
    )
)

@REM 2. Try .tools in user profile (if setup_tools was used)
if "%JAVACMD%"=="" (
    for /d %%i in ("%USERPROFILE%\.tools\jdk*") do (
        if exist "%%i\bin\java.exe" (
            set "JAVACMD=%%i\bin\java.exe"
        )
    )
)

@REM 3. Fallback to java on PATH
if "%JAVACMD%"=="" (
    set "JAVACMD=java"
)

:run
set MAVEN_CMD_LINE_ARGS=%*

"%JAVACMD%" %MAVEN_OPTS% -classpath "%WRAPPER_JAR%" "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" %WRAPPER_LAUNCHER% %MAVEN_CMD_LINE_ARGS%
if ERRORLEVEL 1 goto error
goto end

:error
set ERROR_CODE=1

:end
@endlocal & set ERROR_CODE=%ERROR_CODE%
