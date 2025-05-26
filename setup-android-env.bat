@echo off
echo Setting up Android Development Environment Variables...

REM Set JAVA_HOME to Microsoft OpenJDK 17 installation
setx JAVA_HOME "C:\Program Files\Microsoft\jdk-17.0.15.6-hotspot" /M

REM Set ANDROID_HOME (adjust path if needed)
setx ANDROID_HOME "%LOCALAPPDATA%\Android\Sdk" /M

REM Add to PATH
setx PATH "%PATH%;%JAVA_HOME%\bin;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools\bin" /M

echo Environment variables set successfully!
echo Please restart your command prompt or PowerShell for changes to take effect.
echo.
echo To verify installation, run:
echo   java -version
echo   adb version
echo.
echo Current JAVA_HOME will be: C:\Program Files\Microsoft\jdk-17.0.15.6-hotspot
pause 