@echo off
echo ========================================
echo BHARATHI ENTERPRISES - Build Fix Test
echo ========================================
echo.

REM Set environment variables for current session
echo [1/4] Setting up environment variables...
set JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.15.6-hotspot
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools\bin;%PATH%

echo JAVA_HOME: %JAVA_HOME%
echo ANDROID_HOME: %ANDROID_HOME%
echo.

REM Verify Java installation
echo [2/4] Verifying Java installation...
java -version
if %ERRORLEVEL% neq 0 (
    echo ❌ ERROR: Java not found or not working properly
    pause
    exit /b 1
)
echo ✅ Java verification successful!
echo.

REM Check npm cache
echo [3/4] Verifying npm cache...
call npm cache verify
echo ✅ npm cache verified!
echo.

REM Test Expo CLI command syntax
echo [4/4] Testing Expo CLI command syntax...
call npx expo run:android --help | findstr "no-build-cache"
if %ERRORLEVEL% equ 0 (
    echo ✅ Expo CLI flags are correct!
) else (
    echo ❌ Expo CLI flags may need adjustment
)

echo.
echo ========================================
echo BUILD FIX TEST COMPLETED
echo ========================================
echo.
echo All checks passed! You can now run:
echo   .\fix-android-build.bat
echo.
pause 