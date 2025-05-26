@echo off
echo Setting up Java environment for Android build...

set JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.15.6-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

echo Java version:
java -version

echo.
echo Building Android APK...
npx expo run:android --no-install

echo.
echo Build completed! Check the android/app/build/outputs/apk/ directory for your APK file.
pause 