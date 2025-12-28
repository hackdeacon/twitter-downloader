# 🚂 Deploy to Railway (Full-Stack Version)

This guide explains how to deploy the full-stack Twitter Video Downloader to Railway.

## 📋 Prerequisites

- GitHub account
- Railway account (free)
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

### Step 2: Deploy on Railway

1. **Go to [railway.app](https://railway.app)**
2. **Click "Sign Up"** (use your GitHub account)
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Authorize Railway** (if not already)
6. **Select your repository:**
   - Find `twitter-video-downloader`
   - Click "Deploy Now"

7. **Railway will:**
   - Detect Node.js automatically
   - Run `npm install`
   - Start the server on `npm start`
   - Assign a random URL (e.g., `https://xxx.railway.app`)

8. **Wait 2-3 minutes** for deployment

9. **Get your URL:** Click on the deployed service to see the URL

## 🎯 Method 2: Deploy via Railway CLI

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway

```bash
railway login
```

### Step 3: Deploy

```bash
# In your project directory
railway init

# Follow the prompts
# ? Create a new project? Yes
# ? Project name: twitter-video-downloader

# Deploy
railway up
```

### Step 4: Open in Browser

```bash
railway open
```

## ⚙️ Configuration

Railway auto-detects Node.js. Ensure your `package.json` has:

```json
{
  "name": "twitter-video-downloader",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "node-fetch": "^2.7.0"
  }
}
```

**Railway automatically:**
- Runs `npm install`
- Starts the server with `npm start`
- Exposes the port from `process.env.PORT`

## 🔧 Troubleshooting

### Issue: "Build Failed"

**Solution:**
- Check `package.json` has correct paths
- Ensure `server.js` is in the root directory
- Check Railway logs for specific errors

### Issue: "Application Failed to Start"

**Solution:**
- Verify `server.js` has:
```javascript
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Issue: "Timeout"

**Solution:**
- Railway free tier has cold starts
- First request after inactivity may take 5-10 seconds
- Subsequent requests are fast
- Consider upgrading to paid plan for better performance

### Issue: "Environment Variables"

**Solution:**
- Add variables in Railway dashboard → Variables
- For this app, no extra variables needed
- Railway auto-sets `PORT` and `RAILWAY_ENVIRONMENT`

## 📊 Pricing

**Railway Free Tier:**
- ✅ $5 credit monthly
- ✅ 500 execution hours
- ✅ 1GB RAM
- ✅ 1GB storage
- ✅ Sleep after inactivity
- ✅ 1 project

**Perfect for personal projects!**

## 🌐 Custom Domain (Optional)

1. In Railway dashboard → Your Service → Settings → Domains
2. Click "Custom Domain"
3. Enter your domain (e.g., `downloadvideos.com`)
4. Configure DNS at your domain provider:
   - **A Record:** Point to Railway's IP (shown in dashboard)
   - **CNAME:** Point to `your-service.railway.app`
5. SSL certificate is auto-provisioned

## 📈 Monitoring

### View Logs

```bash
# CLI
railway logs

# Dashboard
# Go to Railway dashboard → Your Service → Deployments
```

### Monitor Usage

- Dashboard → Your Service → Metrics
- View CPU, RAM, Network usage
- Free tier limits: 500 hours/month

## 🎯 Post-Deployment

After deployment:

1. **Test your site:** `https://xxx.railway.app`
2. **Test video download:**
   - Paste a Twitter URL
   - Click Download
   - Verify video preview works
3. **Check logs:** For any errors

## 📝 Environment Variables

Railway auto-sets these:
- `PORT` (random port assigned)
- `RAILWAY_ENVIRONMENT` (production/development)
- `RAILWAY_GIT_COMMIT_SHA` (git commit hash)

For this project, no additional variables needed!

## ✅ Success Checklist

- [ ] GitHub repo created
- [ ] Code pushed to GitHub
- [ ] Railway account created
- [ ] Project deployed from GitHub
- [ ] URL accessible
- [ ] Video download tested
- [ ] Logs checked for errors

## ⚡ Performance Tips

1. **Cold Starts:**
   - First request after sleep may be slow
   - Keep the service active or upgrade to paid plan

2. **Memory:**
   - This app uses minimal memory (<100MB)
   - Well within free tier limits

3. **Network:**
   - Videos stream through the service
   - Monitor bandwidth usage

## 🎉 You're Done!

Your Twitter Video Downloader is now live at:
```
https://your-service-name.railway.app
```

## 📚 Resources

- [Railway Docs](https://docs.railway.app)
- [Railway Node.js Guide](https://docs.railway.app/develop/variables)
- [Custom Domains](https://docs.railway.app/developdomains)

## 🔄 Redeploying

After making changes:

```bash
git add .
git commit -m "Update: description"
git push origin main

# Railway auto-deploys from main branch!
```

## 💡 Pro Tips

1. **Branches:** Deploy from `main` branch only (free tier)
2. **Sleep Mode:** Free tier sleeps after inactivity (wake up takes ~10s)
3. **Upgrade:** For production, consider paid plan ($20/month)
4. **Backups:** Code is in GitHub, no data stored on Railway
