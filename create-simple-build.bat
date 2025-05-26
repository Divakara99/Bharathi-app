@echo off
echo ========================================
echo BHARATHI ENTERPRISES - Simple Build
echo ========================================
echo.
echo This script creates a build without React Native Reanimated
echo to avoid CMake path issues.
echo.

REM Set environment variables
set JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.15.6-hotspot
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools\bin;%PATH%

echo [1/5] Verifying Java...
java -version
if %ERRORLEVEL% neq 0 (
    echo ERROR: Java not found
    pause
    exit /b 1
)

echo [2/5] Temporarily removing React Native Reanimated...
REM Backup package.json
copy package.json package.json.backup

REM Remove reanimated from package.json temporarily
powershell -Command "(Get-Content package.json) -replace '.*react-native-reanimated.*,?' | Set-Content package.json.temp"
move package.json.temp package.json

echo [3/5] Installing dependencies without Reanimated...
call npm install

echo [4/5] Building Android app...
call npx expo run:android --no-build-cache

echo [5/5] Restoring original package.json...
move package.json.backup package.json

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================
    echo SIMPLE BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo Note: This build doesn't include React Native Reanimated
    echo For full functionality, you may need to move the project
    echo to a path without spaces.
) else (
    echo.
    echo Build failed. Please check the error messages above.
)

pause 