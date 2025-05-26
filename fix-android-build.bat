@echo off
echo ========================================
echo BHARATHI ENTERPRISES - Android Build Fix
echo ========================================
echo.

REM Set environment variables for current session
echo [1/6] Setting up environment variables...
set JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.15.6-hotspot
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools\bin;%PATH%

echo JAVA_HOME: %JAVA_HOME%
echo ANDROID_HOME: %ANDROID_HOME%
echo.

REM Verify Java installation
echo [2/6] Verifying Java installation...
java -version
if %ERRORLEVEL% neq 0 (
    echo ERROR: Java not found or not working properly
    echo Please ensure Microsoft OpenJDK 17 is installed
    pause
    exit /b 1
)
echo Java verification successful!
echo.

REM Stop any running Metro bundler
echo [3/6] Stopping any running Metro bundler...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Clean all build artifacts
echo [4/6] Cleaning build artifacts...
if exist android\app\build rmdir /s /q android\app\build
if exist android\build rmdir /s /q android\build
if exist .expo rmdir /s /q .expo
if exist node_modules\.cache rmdir /s /q node_modules\.cache

REM Clear npm cache
echo [5/6] Clearing npm cache...
call npm cache verify

REM Install dependencies if needed
echo Checking dependencies...
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

echo.
echo [6/6] Starting Android build...
echo This may take several minutes...
echo.

REM Try building with different approaches
echo Attempting build with Expo CLI...
call npx expo run:android --no-build-cache --no-bundler

if %ERRORLEVEL% neq 0 (
    echo.
    echo First attempt failed. Trying alternative approach...
    echo.
    
    REM Try with React Native CLI
    echo Attempting build with React Native CLI...
    cd android
    call gradlew clean
    call gradlew assembleDebug
    cd ..
    
    if %ERRORLEVEL% neq 0 (
        echo.
        echo Build failed. Checking for common issues...
        echo.
        echo Common solutions:
        echo 1. Ensure Android Studio is installed with SDK
        echo 2. Check if Android SDK path is correct: %ANDROID_HOME%
        echo 3. Verify Java installation: %JAVA_HOME%
        echo 4. Try moving project to path without spaces
        echo.
        echo For detailed logs, check: android\app\build\outputs\logs\
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo BUILD SUCCESSFUL!
echo ========================================
echo.
echo APK location: android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo To install on device:
echo adb install android\app\build\outputs\apk\debug\app-debug.apk
echo.
pause 