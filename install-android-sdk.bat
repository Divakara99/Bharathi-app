@echo off
echo ========================================
echo BHARATHI ENTERPRISES - Android SDK Installer
echo ========================================
echo.

REM Set paths
set JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.15.6-hotspot
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
set CMDLINE_TOOLS=%ANDROID_HOME%\cmdline-tools\latest

echo [1/5] Creating Android SDK directory...
if not exist "%ANDROID_HOME%" mkdir "%ANDROID_HOME%"
if not exist "%ANDROID_HOME%\cmdline-tools" mkdir "%ANDROID_HOME%\cmdline-tools"

echo [2/5] Downloading Android SDK Command Line Tools...
set SDK_URL=https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip
set SDK_ZIP=%TEMP%\android-cmdline-tools.zip

echo Downloading from: %SDK_URL%
powershell -Command "Invoke-WebRequest -Uri '%SDK_URL%' -OutFile '%SDK_ZIP%'"

if not exist "%SDK_ZIP%" (
    echo ERROR: Failed to download Android SDK tools
    echo Please check your internet connection
    pause
    exit /b 1
)

echo [3/5] Extracting Android SDK tools...
powershell -Command "Expand-Archive -Path '%SDK_ZIP%' -DestinationPath '%ANDROID_HOME%\cmdline-tools' -Force"

REM Move cmdline-tools to correct location
if exist "%ANDROID_HOME%\cmdline-tools\cmdline-tools" (
    move "%ANDROID_HOME%\cmdline-tools\cmdline-tools" "%ANDROID_HOME%\cmdline-tools\latest"
)

echo [4/5] Installing required SDK packages...
set PATH=%JAVA_HOME%\bin;%CMDLINE_TOOLS%\bin;%ANDROID_HOME%\platform-tools;%PATH%

REM Accept licenses first
echo y | "%CMDLINE_TOOLS%\bin\sdkmanager.bat" --licenses

REM Install essential packages
"%CMDLINE_TOOLS%\bin\sdkmanager.bat" "platform-tools" "platforms;android-35" "build-tools;35.0.0" "emulator" "system-images;android-35;google_apis;x86_64"

echo [5/5] Setting up environment variables permanently...
setx ANDROID_HOME "%ANDROID_HOME%" /M
setx PATH "%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\cmdline-tools\latest\bin;%ANDROID_HOME%\emulator" /M

echo.
echo ========================================
echo ANDROID SDK INSTALLED SUCCESSFULLY! ✅
echo ========================================
echo.
echo SDK Location: %ANDROID_HOME%
echo Platform Tools: %ANDROID_HOME%\platform-tools
echo Build Tools: %ANDROID_HOME%\build-tools\35.0.0
echo.
echo Environment variables set:
echo - ANDROID_HOME: %ANDROID_HOME%
echo - PATH updated with Android tools
echo.
echo Cleaning up...
del "%SDK_ZIP%" 2>nul

echo.
echo ========================================
echo READY TO BUILD! 🚀
echo ========================================
echo.
echo Please restart your command prompt and run:
echo   npx expo run:android
echo.
pause 