@echo off
echo Setting up environment for Android build...

REM Set environment variables for current session
set JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.15.6-hotspot
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools\bin;%PATH%

echo JAVA_HOME: %JAVA_HOME%
echo ANDROID_HOME: %ANDROID_HOME%

REM Verify Java installation
echo Checking Java version...
java -version
if %ERRORLEVEL% neq 0 (
    echo ERROR: Java not found or not working properly
    pause
    exit /b 1
)

echo.
echo Starting Android build...
echo.

REM Clean previous builds
echo Cleaning previous builds...
call npx expo run:android --no-build-cache

echo Build completed!
pause 