# 🚀 Deploy to Vercel (Full-Stack Version)

This guide explains how to deploy the full-stack Twitter Video Downloader to Vercel.

## 📋 Prerequisites

- GitHub account
- Vercel account (free)
- Project files (server.js, package.json, index.html, style.css, script.js)

## 🎯 Method 1: Deploy via GitHub (Recommended)

### Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Twitter Video Downloader"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/twitter-video-downloader.git

# Push
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Vercel

1. **Go to [vercel.com](https://vercel.com)**
2. **Click "Sign Up"** (use your GitHub account)
3. **Click "New Project"**
4. **Import your repository:**
   - Select your `twitter-video-downloader` repo
   - Click "Import"

5. **Configure Project:**
   - **Framework Preset:** Node.js
   - **Root Directory:** `/` (default)
   - **Build Command:** `npm run build` (or leave empty)
   - **Output Directory:** Leave empty
   - **Install Command:** `npm install`

6. **Environment Variables:**
   - Vercel auto-detects `server.js`, no extra config needed

7. **Click "Deploy"**

8. **Wait 2-3 minutes** for deployment to complete

9. **Get your URL:** `https://your-project-name.vercel.app`

## 🎯 Method 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy

```bash
# In your project directory
vercel

# Follow the prompts:
# ? Set up and deploy? [Y/n] y
# ? Which scope? (your account)
# ? Link to existing project? [y/N] n
# ? What's your project's name? twitter-video-downloader
# ? In which directory? ./
# ? Override settings? [y/N] n

# Then:
# ? Want to override the settings? [y/N] n
```

### Step 4: Deploy to Production

```bash
vercel --prod
```

## ⚙️ Configuration Files

Vercel auto-detects Node.js, but you can add these files:

### vercel.json (optional)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ]
}
```

### .vercelignore (optional)

```
node_modules
.git
*.log
```

## 🔧 Troubleshooting

### Issue: "Build Command Failed"

**Solution:**
- In Vercel dashboard → Project → Settings → Build Command
- Change to: `npm install && npm start`
- Or set to empty (auto-detect)

### Issue: "Function Timeout"

**Solution:**
- The default timeout is 10 seconds
- For heavy operations, consider optimizing or using background jobs
- For this app, 10 seconds should be enough

### Issue: "Port Not Found"

**Solution:**
- Vercel sets `PORT` environment variable
- Update `server.js`:

```javascript
const PORT = process.env.PORT || 3000;
// Already in the current server.js
```

### Issue: "CORS Errors"

**Solution:**
- Ensure CORS is enabled in `server.js`:
```javascript
app.use(cors());
// Already in the current server.js
```

## 📊 Pricing

**Vercel Free Tier:**
- ✅ 100GB bandwidth
- ✅ Unlimited deployments
- ✅ Custom domains
- ✅ SSL certificates
- ✅ Edge network
- ❌ No server-side rendering
- ❌ Limited function execution time (10s)

**Perfect for this project!**

## 🌐 Custom Domain (Optional)

1. In Vercel dashboard → Project → Settings → Domains
2. Add your domain (e.g., `downloadvideos.com`)
3. Configure DNS:
   - **For apex domain:** Add `A` record pointing to `76.76.19.61`
   - **For subdomain:** Add `CNAME` record pointing to `cname.vercel-dns.com`
4. SSL certificate is auto-provisioned

## 🎯 Post-Deployment

After deployment:

1. **Test your site:** `https://your-project.vercel.app`
2. **Test video download:**
   - Paste a Twitter URL
   - Click Download
   - Verify video preview works
3. **Monitor:** Check Vercel dashboard for analytics

## 📝 Environment Variables

Vercel auto-sets these:
- `VERCEL=1`
- `PORT` (auto-assigned)

For this project, no additional environment variables needed!

## ✅ Success Checklist

- [ ] GitHub repo created
- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Project deployed
- [ ] URL accessible
- [ ] Video download tested
- [ ] Mobile version tested

## 🎉 You're Done!

Your Twitter Video Downloader is now live at:
```
https://your-project-name.vercel.app
```

Share it with the world! 🌍

## 📚 Resources

- [Vercel Docs](https://vercel.com/docs)
- [Vercel Node.js Guide](https://vercel.com/docs/concepts/functions/serverless-functions/node-js)
- [Custom Domains](https://vercel.com/docs/concepts/projects/domains)
