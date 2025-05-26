@echo off
echo ========================================
echo BHARATHI ENTERPRISES - Complete Setup
echo ========================================
echo.

REM Set environment variables
set JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.15.6-hotspot
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools\bin;%PATH%

echo [1/6] Checking Java installation...
java -version
if %ERRORLEVEL% neq 0 (
    echo ERROR: Java not found. Please install Microsoft OpenJDK 17
    pause
    exit /b 1
)
echo ✅ Java is installed

echo [2/6] Checking Android SDK...
if not exist "%ANDROID_HOME%" (
    echo Android SDK not found. Installing via Expo...
    echo This will take several minutes...
    
    REM Install Android SDK via Expo
    call npx @expo/cli install-android-sdk
    
    if %ERRORLEVEL% neq 0 (
        echo Failed to install Android SDK automatically.
        echo.
        echo Please install Android Studio manually:
        echo 1. Download from: https://developer.android.com/studio
        echo 2. Install Android Studio
        echo 3. Open Android Studio and install SDK
        echo 4. Set ANDROID_HOME to SDK location
        echo.
        pause
        exit /b 1
    )
) else (
    echo ✅ Android SDK found at: %ANDROID_HOME%
)

echo [3/6] Verifying npm dependencies...
if not exist node_modules (
    echo Installing npm dependencies...
    call npm install
)

echo [4/6] Clearing any build artifacts...
if exist android\app\build rmdir /s /q android\app\build 2>nul
if exist android\build rmdir /s /q android\build 2>nul
if exist .expo rmdir /s /q .expo 2>nul

echo [5/6] Building Android app...
echo This may take several minutes...
call npx expo run:android --no-build-cache

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================
    echo BUILD SUCCESSFUL! 🎉
    echo ========================================
    echo.
    echo APK location: android\app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo To install on device:
    echo adb install android\app\build\outputs\apk\debug\app-debug.apk
) else (
    echo.
    echo ========================================
    echo BUILD FAILED ❌
    echo ========================================
    echo.
    echo Common solutions:
    echo 1. Install Android Studio from: https://developer.android.com/studio
    echo 2. Ensure Android SDK is properly installed
    echo 3. Check that an Android emulator or device is connected
    echo.
    echo To check connected devices: adb devices
)

echo [6/6] Opening project in VS Code (if available)...
code . 2>nul

echo.
pause 