@echo off
echo ========================================
echo BHARATHI ENTERPRISES - React Native Modules Fix
echo ========================================
echo.

echo [1/5] Stopping all processes...
taskkill /f /im node.exe 2>nul
taskkill /f /im java.exe 2>nul
taskkill /f /im gradle.exe 2>nul
taskkill /f /im adb.exe 2>nul
timeout /t 3 /nobreak >nul

echo [2/5] Stopping Gradle daemon...
cd android
call gradlew --stop 2>nul
cd ..
timeout /t 2 /nobreak >nul

echo [3/5] Clearing all React Native module build directories...

REM List of React Native modules that commonly have build issues
set modules=react-native-gesture-handler react-native-reanimated react-native-maps react-native-safe-area-context react-native-screens react-native-vector-icons react-native-svg react-native-linear-gradient

for %%m in (%modules%) do (
    if exist "node_modules\%%m\android\build" (
        echo Removing %%m build directory...
        rmdir /s /q "node_modules\%%m\android\build" 2>nul
    )
    if exist "node_modules\%%m\android\.cxx" (
        echo Removing %%m CMake cache...
        rmdir /s /q "node_modules\%%m\android\.cxx" 2>nul
    )
)

echo [4/5] Clearing main build directories...
if exist "android\app\build" rmdir /s /q "android\app\build" 2>nul
if exist "android\build" rmdir /s /q "android\build" 2>nul
if exist ".expo" rmdir /s /q ".expo" 2>nul

echo [5/5] Clearing caches...
if exist "%USERPROFILE%\.gradle\caches" rmdir /s /q "%USERPROFILE%\.gradle\caches" 2>nul
call npm cache clean --force 2>nul

echo.
echo ========================================
echo ALL REACT NATIVE MODULES CLEARED
echo ========================================
echo.
echo All React Native module build directories cleared.
echo You can now try building again.
echo.
pause 