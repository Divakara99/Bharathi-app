@echo off
echo ========================================
echo BHARATHI ENTERPRISES - File Locking Fix
echo ========================================
echo.

echo [1/7] Stopping all Node.js processes...
taskkill /f /im node.exe 2>nul
taskkill /f /im java.exe 2>nul
taskkill /f /im gradle.exe 2>nul
timeout /t 3 /nobreak >nul

echo [2/7] Stopping Android Studio and related processes...
taskkill /f /im studio64.exe 2>nul
taskkill /f /im adb.exe 2>nul
timeout /t 2 /nobreak >nul

echo [3/7] Stopping Gradle daemon...
cd android
call gradlew --stop 2>nul
cd ..
timeout /t 2 /nobreak >nul

echo [4/7] Cleaning locked directories...
if exist "node_modules\react-native-gesture-handler\android\build" (
    echo Removing gesture-handler build directory...
    rmdir /s /q "node_modules\react-native-gesture-handler\android\build" 2>nul
)

if exist "node_modules\react-native-reanimated\android\build" (
    echo Removing reanimated build directory...
    rmdir /s /q "node_modules\react-native-reanimated\android\build" 2>nul
)

if exist "node_modules\react-native-reanimated\android\.cxx" (
    echo Removing reanimated CMake cache...
    rmdir /s /q "node_modules\react-native-reanimated\android\.cxx" 2>nul
)

if exist "node_modules\react-native-maps\android\build" (
    echo Removing react-native-maps build directory...
    rmdir /s /q "node_modules\react-native-maps\android\build" 2>nul
)

if exist "android\app\build" (
    echo Removing app build directory...
    rmdir /s /q "android\app\build" 2>nul
)

if exist "android\build" (
    echo Removing android build directory...
    rmdir /s /q "android\build" 2>nul
)

echo [5/7] Clearing Gradle cache...
if exist "%USERPROFILE%\.gradle\caches" (
    echo Clearing user Gradle cache...
    rmdir /s /q "%USERPROFILE%\.gradle\caches" 2>nul
)

echo [6/7] Clearing npm cache...
call npm cache clean --force 2>nul

echo [7/7] Clearing Expo cache...
if exist ".expo" (
    rmdir /s /q ".expo" 2>nul
)

echo.
echo ========================================
echo FILE LOCKING FIX COMPLETED
echo ========================================
echo.
echo All processes stopped and locked files cleared.
echo You can now try building again with:
echo   .\fix-android-build.bat
echo.
pause 