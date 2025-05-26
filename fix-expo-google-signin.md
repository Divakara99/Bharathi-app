# Fix for expo-google-sign-in Maven Plugin Issues

## Problem
Error: `Plugin with id 'maven' not found` when using expo-google-sign-in

## Solution

### 1. Add Maven Plugin to Root build.gradle

Add this to your `android/build.gradle` file:

```gradle
// Top-level build file where you can add configuration options common to all sub-projects/modules.

buildscript {
  repositories {
    google()
    mavenCentral()
  }
  dependencies {
    classpath('com.android.tools.build:gradle')
    classpath('com.facebook.react:react-native-gradle-plugin')
    classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')
  }
}

allprojects {
  repositories {
    maven {
      url(reactNativeAndroidDir)
    }
    google()
    mavenCentral()
    maven { url 'https://www.jitpack.io' }
  }
}

// Add these plugin applications
apply plugin: "maven-publish"
apply plugin: "expo-root-project"
apply plugin: "com.facebook.react.rootproject"
```

### 2. Update App build.gradle

In your `android/app/build.gradle`, ensure you have:

```gradle
android {
    compileSdk 35
    compileSdkVersion 35
    buildToolsVersion "35.0.0"
    
    defaultConfig {
        minSdkVersion 24
        targetSdkVersion 35
        // ... other config
    }
}
```

### 3. Add to gradle.properties

Add these to `android/gradle.properties`:

```properties
# Android SDK versions
android.compileSdkVersion=35
android.buildToolsVersion=35.0.0
android.minSdkVersion=24
android.targetSdkVersion=35
android.ndkVersion=27.1.12297006

# Google Services
android.useAndroidX=true
android.enableJetifier=true
```

### 4. Install expo-google-sign-in

```bash
npx expo install expo-google-sign-in
```

### 5. Configure in app.json/app.config.js

```json
{
  "expo": {
    "plugins": [
      [
        "expo-google-sign-in",
        {
          "iosUrlScheme": "your-ios-url-scheme"
        }
      ]
    ]
  }
}
```

### 6. Add Google Services JSON

1. Download `google-services.json` from Firebase Console
2. Place it in `android/app/` directory
3. Ensure it's referenced in your build.gradle

## Common Issues and Solutions

### Issue: "compileSdkVersion is not specified"
**Solution**: Explicitly set compileSdkVersion in both gradle.properties and app build.gradle

### Issue: "Maven plugin not found"
**Solution**: Add `apply plugin: "maven-publish"` to root build.gradle

### Issue: "Google Services plugin not found"
**Solution**: Add Google Services classpath to buildscript dependencies:
```gradle
classpath 'com.google.gms:google-services:4.3.15'
```

## Testing

After making these changes:
1. Run `.\fix-file-locking.bat` to clear caches
2. Run `.\fix-android-build.bat` to build
3. Test Google Sign-In functionality

## Notes

- Make sure your Google Services configuration matches your app's package name
- Test on both debug and release builds
- Ensure proper OAuth configuration in Google Cloud Console 