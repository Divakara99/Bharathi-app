@echo off
echo.
echo ========================================
echo   BHARATHI ENTERPRISES APK BUILDER
echo ========================================
echo.

echo [1/4] Navigating to Android project...
cd android
if not exist "gradlew.bat" (
    echo ERROR: Android project not found!
    echo Make sure you're in the right directory.
    pause
    exit /b 1
)

echo [2/4] Cleaning previous builds...
call gradlew.bat clean
echo.

echo [3/4] Building APK (this may take 5-10 minutes)...
echo Please wait...
call gradlew.bat assembleDebug
if %ERRORLEVEL% neq 0 (
    echo.
    echo BUILD FAILED! 
    echo Try opening Android Studio and building from there.
    pause
    exit /b 1
)

echo.
echo [4/4] Copying APK to main folder...
if exist "app\build\outputs\apk\debug\app-debug.apk" (
    copy "app\build\outputs\apk\debug\app-debug.apk" "..\bharathi-enterprises.apk"
    echo.
    echo ========================================
    echo   SUCCESS! APK BUILT SUCCESSFULLY!
    echo ========================================
    echo.
    echo Your APK is ready: bharathi-enterprises.apk
    echo File size: 
    dir "..\bharathi-enterprises.apk" | find "bharathi-enterprises.apk"
    echo.
    echo You can now install this on your Android phone!
    echo.
) else (
    echo ERROR: APK file not found after build.
    echo Check for errors above.
)

cd ..
echo.
echo Press any key to exit...
pause > nul 