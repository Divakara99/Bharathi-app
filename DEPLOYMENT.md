# Netlify Deployment Guide

## Method 1: Drag and Drop (Easiest)

1. **Open Netlify** in your browser
2. **Drag and drop your entire project folder** to the Netlify dashboard
3. **Wait for the build to complete**
4. **Your site will be live!**

## Method 2: Git Integration (Recommended for updates)

1. **Push your code to GitHub**
2. **Connect your GitHub repository to Netlify**
3. **Set build settings:**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 18

## Environment Variables

Make sure to set these environment variables in Netlify:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Troubleshooting

If the build fails:
1. Check that all dependencies are in `package.json`
2. Ensure Node.js version is 18 or higher
3. Verify environment variables are set correctly

## Current Issues

The build is currently failing due to static generation issues. This is a known issue with Next.js 14 and client-side components. The app will work fine in development mode.
