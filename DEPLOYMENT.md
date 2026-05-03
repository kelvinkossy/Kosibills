# Deployment Guide - Kosi Bills

## Quick Deploy to Render (Free Tier)

### Prerequisites
- GitHub account
- Render account (free at render.com)
- Your domain name (optional)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/kosi-bills.git
git push -u origin main
```

### Step 2: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Verify email

### Step 3: Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Render will auto-detect Node.js
4. Configure:
   - **Name**: kosi-bills
   - **Region**: Oregon (or nearest to you)
   - **Branch**: main
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node server.ts`

### Step 4: Add Environment Variables
In Render dashboard, add these environment variables:

**Required:**
```
NODE_ENV=production
PORT=5000
JWT_SECRET=your-random-64-character-secret
BVN_ENCRYPTION_KEY=your-random-32-character-key
```

**Generate secrets:**
```bash
# JWT Secret (64 chars)
openssl rand -base64 48

# BVN Encryption Key (32 chars)
openssl rand -base64 24
```

**Optional but recommended:**
```
APP_URL=https://your-app.onrender.com
ADMIN_EMAIL=your-email@example.com
```

**For email features:**
```
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Step 5: Deploy
Click "Create Web Service"
- Wait for build (2-5 minutes)
- Render will provide a URL like: `https://kosi-bills-xxxx.onrender.com`

### Step 6: Connect Custom Domain (Optional)
1. In Render dashboard → Settings → Custom Domains
2. Add your domain (e.g., `yourdomain.com`)
3. Update your DNS records:
   - Type: CNAME
   - Name: @
   - Value: `your-app.onrender.com`

## Environment Variables Reference

### Critical (Must Set)
- `JWT_SECRET` - Random 64-character string for JWT signing
- `BVN_ENCRYPTION_KEY` - Random 32-character string for BVN encryption

### For Email Features
- `SMTP_HOST` - SMTP server host
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password

### For Payment Features
- `FLW_SECRET_KEY` - Flutterwave secret key
- `FLW_PUBLIC_KEY` - Flutterwave public key

### For Push Notifications
- `VAPID_PUBLIC_KEY` - VAPID public key
- `VAPID_PRIVATE_KEY` - VAPID private key

### For SMS Features
- `TERMII_API_KEY` - Termii API key

### For Firebase
- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- etc.

### For AI Features
- `GEMINI_API_KEY` - Google Gemini API key

## Troubleshooting

### Build Fails
- Check Node.js version (should be 18+)
- Check all dependencies are in package.json
- Check build logs in Render dashboard

### App Starts but Shows Errors
- Check all environment variables are set
- Check JWT_SECRET and BVN_ENCRYPTION_KEY are set
- Check database permissions (Render uses ephemeral storage - use disk for SQLite)

### Database Issues on Render
Render's free tier has ephemeral storage. For persistent SQLite:
1. Upgrade to paid plan ($7/month) for persistent disk
2. Or use external database (PostgreSQL/MySQL)

### Custom Domain Not Working
- DNS propagation can take 24-48 hours
- Check CNAME record is correct
- Clear browser cache

## Alternative Hosting Platforms

### Railway
- Free tier available
- Similar setup to Render
- Better persistent storage options

### Fly.io
- Free allowance ($5/month credit)
- Global deployment
- Good performance

### Vercel + Railway
- Frontend on Vercel (free)
- Backend on Railway
- More complex setup

## Post-Deployment Checklist

- [ ] Test user registration
- [ ] Test login functionality
- [ ] Test all admin features
- [ ] Configure email (if needed)
- [ ] Set up custom domain
- [ ] Enable SSL (automatic on Render)
- [ ] Set up monitoring (Render provides logs)
- [ ] Configure backup strategy

## Security Notes

1. **Never commit .env file** - Use environment variables
2. **Use strong secrets** - Generate with openssl
3. **Enable HTTPS** - Automatic on Render
4. **Set ADMIN_EMAIL** - For admin access
5. **Regular backups** - If using paid plan with persistent storage
