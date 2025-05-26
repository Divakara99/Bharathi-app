Write-Host "Building BHARATHI ENTERPRISES APK..." -ForegroundColor Green

# Navigate to android directory
Set-Location android

# Build debug APK
Write-Host "Building debug APK..." -ForegroundColor Cyan
& .\gradlew.bat assembleDebug

# Build release APK  
Write-Host "Building release APK..." -ForegroundColor Cyan
& .\gradlew.bat assembleRelease

# Copy APK files
$debugApk = "app\build\outputs\apk\debug\app-debug.apk"
$releaseApk = "app\build\outputs\apk\release\app-release.apk"

if (Test-Path $debugApk) {
    Copy-Item $debugApk "..\bharathi-enterprises-debug.apk"
    Write-Host "Debug APK copied to root directory" -ForegroundColor Green
}

if (Test-Path $releaseApk) {
    Copy-Item $releaseApk "..\bharathi-enterprises-release.apk"
    Write-Host "Release APK copied to root directory" -ForegroundColor Green
}

Set-Location ..
Write-Host "Build completed!" -ForegroundColor Green 