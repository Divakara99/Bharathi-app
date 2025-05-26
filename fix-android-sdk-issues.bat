@echo off
echo ========================================
echo BHARATHI ENTERPRISES - Android SDK Fix
echo ========================================
echo.

echo [1/4] Adding missing SDK versions to gradle.properties...

REM Add SDK versions to gradle.properties if not present
findstr /C:"android.compileSdkVersion" android\gradle.properties >nul
if %ERRORLEVEL% neq 0 (
    echo Adding Android SDK versions...
    echo. >> android\gradle.properties
    echo # Android SDK versions >> android\gradle.properties
    echo android.compileSdkVersion=35 >> android\gradle.properties
    echo android.buildToolsVersion=35.0.0 >> android\gradle.properties
    echo android.minSdkVersion=24 >> android\gradle.properties
    echo android.targetSdkVersion=35 >> android\gradle.properties
    echo android.ndkVersion=27.1.12297006 >> android\gradle.properties
    echo ✅ SDK versions added to gradle.properties
) else (
    echo ✅ SDK versions already present
)

echo [2/4] Fixing root build.gradle for maven plugin...

REM Check if maven plugin is in root build.gradle
findstr /C:"id 'maven'" android\build.gradle >nul
if %ERRORLEVEL% neq 0 (
    echo Adding maven plugin to root build.gradle...
    
    REM Create backup
    copy android\build.gradle android\build.gradle.backup
    
    REM Add maven plugin after the existing plugins
    powershell -Command "(Get-Content android\build.gradle) -replace 'apply plugin: \"expo-root-project\"', 'apply plugin: \"maven-publish\"`napply plugin: \"expo-root-project\"' | Set-Content android\build.gradle.temp"
    move android\build.gradle.temp android\build.gradle
    echo ✅ Maven plugin added to root build.gradle
) else (
    echo ✅ Maven plugin already present
)

echo [3/4] Updating app build.gradle for better compatibility...

REM Ensure compileSdkVersion is explicitly set in app build.gradle
findstr /C:"compileSdkVersion 35" android\app\build.gradle >nul
if %ERRORLEVEL% neq 0 (
    echo Updating app build.gradle...
    copy android\app\build.gradle android\app\build.gradle.backup
    
    powershell -Command "(Get-Content android\app\build.gradle) -replace 'compileSdk rootProject.ext.compileSdkVersion', 'compileSdk 35`n    compileSdkVersion 35' | Set-Content android\app\build.gradle.temp"
    move android\app\build.gradle.temp android\app\build.gradle
    echo ✅ App build.gradle updated
) else (
    echo ✅ App build.gradle already configured
)

echo [4/4] Creating gradle wrapper properties...

REM Ensure gradle wrapper is properly configured
if not exist android\gradle\wrapper\gradle-wrapper.properties (
    echo Creating gradle wrapper properties...
    mkdir android\gradle\wrapper 2>nul
    echo distributionBase=GRADLE_USER_HOME > android\gradle\wrapper\gradle-wrapper.properties
    echo distributionPath=wrapper/dists >> android\gradle\wrapper\gradle-wrapper.properties
    echo distributionUrl=https\://services.gradle.org/distributions/gradle-8.13-all.zip >> android\gradle\wrapper\gradle-wrapper.properties
    echo zipStoreBase=GRADLE_USER_HOME >> android\gradle\wrapper\gradle-wrapper.properties
    echo zipStorePath=wrapper/dists >> android\gradle\wrapper\gradle-wrapper.properties
    echo ✅ Gradle wrapper properties created
) else (
    echo ✅ Gradle wrapper already configured
)

echo.
echo ========================================
echo ANDROID SDK FIX COMPLETED
echo ========================================
echo.
echo Fixed issues:
echo ✅ Added missing compileSdkVersion and other SDK versions
echo ✅ Added maven plugin to resolve plugin errors
echo ✅ Updated build.gradle configurations
echo ✅ Ensured gradle wrapper is properly configured
echo.
echo You can now try building with:
echo   .\fix-android-build.bat
echo.
pause 