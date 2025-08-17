# 🚀 Netlify Deployment Guide

## **Step 1: Prepare Your Project**

Your project is now configured for Netlify deployment with:
- ✅ `netlify.toml` configuration file
- ✅ Optimized `next.config.js` for Netlify
- ✅ Build scripts ready

## **Step 2: Deploy to Netlify**

### **Option A: Drag & Drop (Easiest)**
1. **Go to [netlify.com](https://netlify.com)**
2. **Sign up/Login**
3. **You'll see a big drag & drop area**
4. **Drag your entire project folder** to the drop zone
5. **Wait for deployment**

### **Option B: Manual Upload**
1. **Go to [netlify.com](https://netlify.com)**
2. **Click "New site from Git"**
3. **Choose "Deploy manually"**
4. **Upload your project folder**

## **Step 3: Configure Build Settings**

After uploading, set these in Netlify:

### **Build Settings:**
- **Build command:** `npm run build`
- **Publish directory:** `.next`
- **Node version:** 18

### **Environment Variables:**
Add these in Netlify Settings > Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://uspkxofsscqdptevvand.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcGt4b2Zzc2NxZHB0ZXZ2YW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNTcwOTgsImV4cCI6MjA3MDgzMzA5OH0.enz-02-1iilnUU3YGj10VXdRYvWU0aFYX14zp9KVteI
```

## **Step 4: Troubleshooting**

### **If Build Fails:**

1. **Check Environment Variables**
   - Make sure Supabase URL and key are correct
   - Ensure they start with `NEXT_PUBLIC_`

2. **Node Version**
   - Set Node version to 18 in Netlify settings

3. **Build Command**
   - Use: `npm run build`
   - Not: `npm run build:netlify`

4. **Publish Directory**
   - Use: `.next`
   - Not: `out` or `dist`

### **Common Issues:**

- **"Event handlers cannot be passed"**: This is expected for client components
- **"Static generation timeout"**: Normal for dynamic apps
- **"Build timeout"**: Increase build timeout in Netlify settings

## **Step 5: Your Site is Live!**

Once deployed, your site will be available at:
- `https://your-site-name.netlify.app`
- You can add a custom domain later

## **Step 6: Test Your App**

1. **Owner Login:**
   - Email: `Akhildivakara@gmail.com`
   - Password: `9959827826Dd@`

2. **Test Features:**
   - ✅ Product management
   - ✅ Order processing
   - ✅ Delivery tracking
   - ✅ Payment collection

## **🎯 Ready to Deploy!**

Your project is now optimized for Netlify. Just drag and drop to deploy!
