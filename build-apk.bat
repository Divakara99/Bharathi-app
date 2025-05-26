@echo off
echo Building BHARATHI ENTERPRISES APK...
echo.

REM Set environment variables
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools;%PATH%

echo Checking environment...
echo JAVA_HOME: %JAVA_HOME%
echo ANDROID_HOME: %ANDROID_HOME%
echo.

REM Clean previous builds
echo Cleaning previous builds...
cd android
call gradlew clean
if %ERRORLEVEL% neq 0 (
    echo Clean failed! Continuing anyway...
)

REM Build debug APK first (faster)
echo Building debug APK...
call gradlew assembleDebug
if %ERRORLEVEL% neq 0 (
    echo Debug build failed!
    pause
    exit /b 1
)

REM Build release APK
echo Building release APK...
call gradlew assembleRelease
if %ERRORLEVEL% neq 0 (
    echo Release build failed!
    echo Trying with debug keystore...
    call gradlew assembleRelease -Pandroid.injected.signing.store.file=debug.keystore -Pandroid.injected.signing.store.password=android -Pandroid.injected.signing.key.alias=androiddebugkey -Pandroid.injected.signing.key.password=android
)

echo.
echo Build completed!
echo.
echo APK files location:
echo Debug APK: android\app\build\outputs\apk\debug\app-debug.apk
echo Release APK: android\app\build\outputs\apk\release\app-release.apk
echo.

REM Copy APK to root directory for easy access
if exist "app\build\outputs\apk\debug\app-debug.apk" (
    copy "app\build\outputs\apk\debug\app-debug.apk" "..\bharathi-enterprises-debug.apk"
    echo Copied debug APK to: bharathi-enterprises-debug.apk
)

if exist "app\build\outputs\apk\release\app-release.apk" (
    copy "app\build\outputs\apk\release\app-release.apk" "..\bharathi-enterprises-release.apk"
    echo Copied release APK to: bharathi-enterprises-release.apk
)

cd ..
echo.
echo Build process completed!
echo You can now install the APK on your Android device.
echo.
pause 