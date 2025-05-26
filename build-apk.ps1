Write-Host "Building BHARATHI ENTERPRISES APK..." -ForegroundColor Green
Write-Host ""

# Function to find Android Studio installation
function Find-AndroidStudio {
    $possiblePaths = @(
        "C:\Program Files\Android\Android Studio\jbr",
        "C:\Program Files (x86)\Android\Android Studio\jbr",
        "$env:LOCALAPPDATA\Android\Android Studio\jbr"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            return $path
        }
    }
    return $null
}

# Function to find Android SDK
function Find-AndroidSDK {
    $possiblePaths = @(
        "$env:LOCALAPPDATA\Android\Sdk",
        "$env:APPDATA\Android\Sdk",
        "C:\Android\Sdk"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            return $path
        }
    }
    return $null
}

# Set environment variables
$javaHome = Find-AndroidStudio
$androidHome = Find-AndroidSDK

if ($javaHome) {
    $env:JAVA_HOME = $javaHome
    Write-Host "Found Java: $javaHome" -ForegroundColor Yellow
} else {
    Write-Host "Warning: Android Studio JBR not found. Using system Java." -ForegroundColor Red
}

if ($androidHome) {
    $env:ANDROID_HOME = $androidHome
    $env:ANDROID_SDK_ROOT = $androidHome
    Write-Host "Found Android SDK: $androidHome" -ForegroundColor Yellow
} else {
    Write-Host "Warning: Android SDK not found. Please install Android Studio." -ForegroundColor Red
}

Write-Host ""

# Navigate to android directory
if (!(Test-Path "android")) {
    Write-Host "Error: Android directory not found. Run 'npx expo prebuild' first." -ForegroundColor Red
    exit 1
}

Set-Location android

# Clean previous builds
Write-Host "Cleaning previous builds..." -ForegroundColor Cyan
try {
    & .\gradlew.bat clean
    Write-Host "Clean completed successfully." -ForegroundColor Green
} catch {
    Write-Host "Clean failed, continuing anyway..." -ForegroundColor Yellow
}

# Build debug APK
Write-Host ""
Write-Host "Building debug APK..." -ForegroundColor Cyan
try {
    & .\gradlew.bat assembleDebug
    Write-Host "Debug APK built successfully!" -ForegroundColor Green
} catch {
    Write-Host "Debug build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Build release APK
Write-Host ""
Write-Host "Building release APK..." -ForegroundColor Cyan
try {
    & .\gradlew.bat assembleRelease
    Write-Host "Release APK built successfully!" -ForegroundColor Green
} catch {
    Write-Host "Release build failed, trying with debug keystore..." -ForegroundColor Yellow
    try {
        & .\gradlew.bat assembleRelease -Pandroid.injected.signing.store.file=debug.keystore -Pandroid.injected.signing.store.password=android -Pandroid.injected.signing.key.alias=androiddebugkey -Pandroid.injected.signing.key.password=android
        Write-Host "Release APK built with debug keystore!" -ForegroundColor Green
    } catch {
        Write-Host "Release build failed completely!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Build completed!" -ForegroundColor Green
Write-Host ""

# Check for APK files and copy them
$debugApk = "app\build\outputs\apk\debug\app-debug.apk"
$releaseApk = "app\build\outputs\apk\release\app-release.apk"

if (Test-Path $debugApk) {
    Copy-Item $debugApk "..\bharathi-enterprises-debug.apk"
    Write-Host "✓ Debug APK copied to: bharathi-enterprises-debug.apk" -ForegroundColor Green
    $debugSize = (Get-Item $debugApk).Length / 1MB
    Write-Host "  Size: $([math]::Round($debugSize, 2)) MB" -ForegroundColor Gray
}

if (Test-Path $releaseApk) {
    Copy-Item $releaseApk "..\bharathi-enterprises-release.apk"
    Write-Host "✓ Release APK copied to: bharathi-enterprises-release.apk" -ForegroundColor Green
    $releaseSize = (Get-Item $releaseApk).Length / 1MB
    Write-Host "  Size: $([math]::Round($releaseSize, 2)) MB" -ForegroundColor Gray
}

Set-Location ..

Write-Host ""
Write-Host "🎉 Build process completed!" -ForegroundColor Green
Write-Host "📱 You can now install the APK on your Android device." -ForegroundColor Cyan
Write-Host ""
Write-Host "To install on your phone:" -ForegroundColor Yellow
Write-Host "1. Enable 'Unknown Sources' in Android Settings > Security" -ForegroundColor White
Write-Host "2. Transfer the APK file to your phone" -ForegroundColor White
Write-Host "3. Tap the APK file to install" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to continue" 