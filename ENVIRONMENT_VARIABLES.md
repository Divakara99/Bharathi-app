# 🔧 Environment Variables for Netlify

## **📋 Required Environment Variables:**

You need to add these in your Netlify dashboard:

### **Step 1: Go to Netlify Dashboard**
1. **Open [netlify.com](https://netlify.com)**
2. **Sign in to your account**
3. **Click on your deployed site**

### **Step 2: Add Environment Variables**
1. **Go to Site Settings > Environment Variables**
2. **Click "Add a variable"**
3. **Add these TWO variables:**

---

**Variable 1:**
- **Key:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://uspkxofsscqdptevvand.supabase.co`

**Variable 2:**
- **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcGt4b2Zzc2NxZHB0ZXZ2YW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNTcwOTgsImV4cCI6MjA3MDgzMzA5OH0.enz-02-1iilnUU3YGj10VXdRYvWU0aFYX14zp9KVteI`

---

### **Step 3: Save and Redeploy**
1. **Click "Save"**
2. **Go to Deploys tab**
3. **Click "Trigger deploy"**
4. **Wait for build to complete**

## **🎯 Why These Are Needed:**

- **`NEXT_PUBLIC_SUPABASE_URL`**: Tells your app where to find your Supabase database
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Allows your app to connect to Supabase securely

## **📞 After Adding Variables:**

Your app should work properly. Try logging in with:
- **Email:** `Akhildivakara@gmail.com`
- **Password:** `9959827826Dd@`

## **🚨 Important Notes:**

- ✅ Make sure to copy the values exactly as shown
- ✅ Don't add extra spaces or characters
- ✅ The variables must start with `NEXT_PUBLIC_`
- ✅ After adding, you must redeploy your site

**These environment variables are essential for your app to work!**
