# 🔧 App Not Working After Deployment - Troubleshooting Guide

## **🚨 Common Issues & Solutions:**

### **Issue 1: Environment Variables Missing**

**Problem:** App shows "supabaseUrl is required" or authentication fails

**Solution:**
1. **Go to Netlify Dashboard**
2. **Click on your site**
3. **Go to Site Settings > Environment Variables**
4. **Add these variables:**

```
NEXT_PUBLIC_SUPABASE_URL=https://uspkxofsscqdptevvand.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcGt4b2Zzc2NxZHB0ZXZ2YW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNTcwOTgsImV4cCI6MjA3MDgzMzA5OH0.enz-02-1iilnUU3YGj10VXdRYvWU0aFYX14zp9KVteI
```

5. **Redeploy your site**

### **Issue 2: Build Configuration Wrong**

**Problem:** App shows 404 or blank page

**Solution:**
1. **Go to Netlify Dashboard**
2. **Click on your site**
3. **Go to Site Settings > Build & Deploy**
4. **Set these values:**
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Node version:** 18

### **Issue 3: Supabase Database Issues**

**Problem:** Can't login or data not loading

**Solution:**
1. **Check Supabase Dashboard**
2. **Verify your project is active**
3. **Check if RLS policies are correct**
4. **Test database connection**

### **Issue 4: CORS Issues**

**Problem:** API calls failing

**Solution:**
1. **Go to Supabase Dashboard**
2. **Settings > API**
3. **Add your Netlify domain to allowed origins:**
   - `https://your-site.netlify.app`
   - `https://*.netlify.app`

## **🔍 How to Check What's Wrong:**

### **Step 1: Check Browser Console**
1. **Open your deployed site**
2. **Press F12 to open Developer Tools**
3. **Go to Console tab**
4. **Look for error messages**

### **Step 2: Check Netlify Logs**
1. **Go to Netlify Dashboard**
2. **Click on your site**
3. **Go to Functions tab**
4. **Check for build errors**

### **Step 3: Test Local Version**
1. **Run `npm run dev` locally**
2. **Check if it works on localhost**
3. **Compare with deployed version**

## **🚀 Quick Fix Steps:**

### **Option 1: Redeploy with Correct Settings**
1. **Update environment variables in Netlify**
2. **Trigger a new deployment**
3. **Wait for build to complete**

### **Option 2: Use Static HTML Version**
1. **Upload just the `public/index.html` file**
2. **This will work immediately**
3. **No build process needed**

### **Option 3: Check Supabase Status**
1. **Go to [supabase.com](https://supabase.com)**
2. **Check if your project is running**
3. **Verify database is accessible**

## **📞 What Error Are You Seeing?**

Please tell me:
1. **What error message appears?**
2. **What happens when you try to login?**
3. **Is the page completely blank or showing something?**
4. **What's your Netlify URL?**

## **🎯 Most Likely Solution:**

**The issue is probably missing environment variables in Netlify.**
Follow the steps above to add them and redeploy.
