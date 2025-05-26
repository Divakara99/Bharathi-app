# 🚀 Android Studio Build Guide for BHARATHI ENTERPRISES App

## 📋 Prerequisites
1. **Android Studio** installed on your computer
2. **Android SDK** (comes with Android Studio)
3. **Java Development Kit (JDK)** (comes with Android Studio)

## 🎯 Step-by-Step Instructions

### Step 1: Open Android Studio
1. Launch **Android Studio** from your desktop or start menu
2. If this is your first time, complete the setup wizard

### Step 2: Open Your Project
1. Click **"Open an existing Android Studio project"**
2. Navigate to: `C:\Users\akhil\OneDrive\Desktop\bharathi\ap30app\android`
3. Select the **android** folder and click **"OK"**

### Step 3: Wait for Project to Load
1. Android Studio will take 2-5 minutes to:
   - Index files
   - Download dependencies
   - Sync Gradle
2. You'll see progress at the bottom of the screen
3. **Wait until all processes complete** before proceeding

### Step 4: Build the APK
1. In the top menu, click **"Build"**
2. Select **"Build Bundle(s) / APK(s)"**
3. Choose **"Build APK(s)"**
4. Wait for the build to complete (5-10 minutes)

### Step 5: Find Your APK
1. When build completes, you'll see a notification
2. Click **"locate"** in the notification, OR
3. Navigate to: `android\app\build\outputs\apk\debug\`
4. Your APK file will be: **`app-debug.apk`**

## 🔧 If You Get Errors

### Error: "Gradle sync failed"
1. Click **"Try Again"** button
2. If still fails, go to **File > Invalidate Caches and Restart**

### Error: "SDK not found"
1. Go to **File > Settings > Appearance & Behavior > System Settings > Android SDK**
2. Make sure Android SDK is installed
3. Click **"Apply"** and **"OK"**

### Error: "Build failed"
1. In the bottom panel, click **"Build"** tab
2. Look for red error messages
3. Try: **Build > Clean Project**, then **Build > Rebuild Project**

## 📱 Install APK on Your Phone

### Method 1: USB Cable
1. Connect your phone to computer with USB cable
2. Enable **"USB Debugging"** on your phone:
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings > Developer Options
   - Enable "USB Debugging"
3. In Android Studio, click **"Run"** button (green play icon)
4. Select your phone from the device list

### Method 2: Manual Installation
1. Copy the APK file to your phone (via USB, email, or cloud storage)
2. On your phone:
   - Go to Settings > Security
   - Enable **"Unknown Sources"** or **"Install unknown apps"**
3. Open the APK file on your phone
4. Tap **"Install"**

## 🎉 Success!
Your BHARATHI ENTERPRISES app should now be installed and ready to use!

## 📞 Need Help?
If you encounter any issues:
1. Take a screenshot of the error
2. Note which step you're on
3. The error message will help identify the solution

## 🔄 Alternative: Use EAS Build (Easier)
If Android Studio is too complex, your app is already building in the cloud:
1. Go to: https://expo.dev/accounts/akhildivakara/projects/ap30/builds
2. Wait for build to complete
3. Download the APK directly from the website

---
**Built with ❤️ for BHARATHI ENTERPRISES** 