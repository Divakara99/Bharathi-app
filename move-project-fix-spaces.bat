@echo off
echo ========================================
echo BHARATHI ENTERPRISES - Permanent Fix
echo Moving Project to Path Without Spaces
echo ========================================
echo.

echo Current path has spaces which causes file locking issues:
echo %CD%
echo.

REM Create new directory without spaces
set NEW_PATH=C:\dev\bharathi-app
echo Creating new directory: %NEW_PATH%

if not exist C:\dev mkdir C:\dev
if exist %NEW_PATH% (
    echo Directory already exists. Removing old version...
    rmdir /s /q %NEW_PATH%
)

echo.
echo [1/4] Stopping all processes...
taskkill /f /im node.exe 2>nul
taskkill /f /im java.exe 2>nul
taskkill /f /im gradle.exe 2>nul
taskkill /f /im adb.exe 2>nul

echo [2/4] Copying project to new location...
echo This may take a few minutes...
xcopy "%CD%" "%NEW_PATH%" /E /I /H /Y /Q

echo [3/4] Cleaning up build artifacts in new location...
if exist "%NEW_PATH%\android\app\build" rmdir /s /q "%NEW_PATH%\android\app\build"
if exist "%NEW_PATH%\android\build" rmdir /s /q "%NEW_PATH%\android\build"
if exist "%NEW_PATH%\.expo" rmdir /s /q "%NEW_PATH%\.expo"
if exist "%NEW_PATH%\node_modules\.cache" rmdir /s /q "%NEW_PATH%\node_modules\.cache"

echo [4/4] Creating build script for new location...
echo @echo off > "%NEW_PATH%\build-android.bat"
echo echo ========================================= >> "%NEW_PATH%\build-android.bat"
echo echo BHARATHI ENTERPRISES - Android Build >> "%NEW_PATH%\build-android.bat"
echo echo ========================================= >> "%NEW_PATH%\build-android.bat"
echo echo. >> "%NEW_PATH%\build-android.bat"
echo set JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.15.6-hotspot >> "%NEW_PATH%\build-android.bat"
echo set ANDROID_HOME=%%LOCALAPPDATA%%\Android\Sdk >> "%NEW_PATH%\build-android.bat"
echo set PATH=%%JAVA_HOME%%\bin;%%ANDROID_HOME%%\tools;%%ANDROID_HOME%%\platform-tools;%%ANDROID_HOME%%\tools\bin;%%PATH%% >> "%NEW_PATH%\build-android.bat"
echo echo Building Android app... >> "%NEW_PATH%\build-android.bat"
echo npx expo run:android --no-build-cache >> "%NEW_PATH%\build-android.bat"
echo pause >> "%NEW_PATH%\build-android.bat"

echo.
echo ========================================
echo PROJECT MOVED SUCCESSFULLY!
echo ========================================
echo.
echo Old location: %CD%
echo New location: %NEW_PATH%
echo.
echo To continue development:
echo 1. Open new Command Prompt
echo 2. cd %NEW_PATH%
echo 3. Run: build-android.bat
echo.
echo This will eliminate all file locking issues!
echo.
echo Opening new location in Explorer...
start explorer "%NEW_PATH%"
echo.
pause 