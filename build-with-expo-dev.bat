@echo off
echo ========================================
echo BHARATHI ENTERPRISES - Expo Development Build
echo ========================================
echo.

REM Set Java environment
set JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.15.6-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

echo [1/4] Verifying Java installation...
java -version
if %ERRORLEVEL% neq 0 (
    echo ERROR: Java not found
    pause
    exit /b 1
)
echo ✅ Java is working

echo [2/4] Installing Expo CLI globally...
call npm install -g @expo/cli

echo [3/4] Setting up Expo Development Build...
echo This approach uses Expo's cloud build service (EAS Build)
echo which eliminates the need for local Android SDK installation.
echo.

REM Check if user is logged in to Expo
call npx expo whoami
if %ERRORLEVEL% neq 0 (
    echo Please log in to your Expo account:
    call npx expo login
)

echo [4/4] Building with EAS Build (Cloud)...
echo.
echo Choose build option:
echo 1. Development Build (for testing)
echo 2. Preview Build (for sharing)
echo 3. Production Build (for app stores)
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo Building development version...
    call npx eas build --platform android --profile development
) else if "%choice%"=="2" (
    echo Building preview version...
    call npx eas build --platform android --profile preview
) else if "%choice%"=="3" (
    echo Building production version...
    call npx eas build --platform android --profile production
) else (
    echo Invalid choice. Building development version...
    call npx eas build --platform android --profile development
)

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================
    echo BUILD SUBMITTED SUCCESSFULLY! 🎉
    echo ========================================
    echo.
    echo Your build is being processed in the cloud.
    echo You can monitor progress at: https://expo.dev/
    echo.
    echo Once complete, you'll receive a download link for your APK.
    echo.
    echo Alternative: Use Expo Go app for instant testing:
    echo 1. Install Expo Go from Play Store
    echo 2. Run: npx expo start
    echo 3. Scan QR code with Expo Go
) else (
    echo.
    echo ========================================
    echo BUILD FAILED ❌
    echo ========================================
    echo.
    echo Trying local development server instead...
    echo.
    echo Starting Expo development server...
    call npx expo start
)

echo.
pause 