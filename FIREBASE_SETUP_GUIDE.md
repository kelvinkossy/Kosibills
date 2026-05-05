# Firebase Setup Guide

This guide will help you set up a new Firebase project with Google Authentication for Kosi Bills.

## Step 1: Create a New Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "kosi-bills-auth")
4. Accept the Firebase terms
5. Disable Google Analytics (not needed for this project)
6. Click "Create project"

## Step 2: Enable Google Authentication

1. In your Firebase project, go to **Build** → **Authentication**
2. Click **Get Started**
3. Click on **Sign-in method** tab
4. Find **Google** and click it
5. Enable Google sign-in
6. Enter a project support email (e.g., support@kosibills.com)
7. Click **Save**

## Step 3: Add Authorized Domains

1. In Firebase Authentication, go to **Settings** (gear icon)
2. Click on **Authorized domains**
3. Add the following domains:
   - `localhost` (for local development)
   - `kosibills.onrender.com` (your Render deployment)
   - `kosibills.com.ng` (your custom domain)
4. Click **Add** for each domain

## Step 4: Get Firebase Configuration

1. Go to **Project Settings** (gear icon next to Project Overview)
2. Scroll down to **Your apps** section
3. Click on the web icon (`</>`) to add a web app
4. Enter an app name (e.g., "Kosi Bills Web")
5. Click **Register app**
6. Copy the firebaseConfig object
7. Replace the content of `firebase-applet-config.json` with the new config

## Step 5: Update Environment Variables (Optional)

If you need to override the Firebase config in production, add these to your environment:

```
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

## Step 6: Test Google Sign-In

1. Restart your development server
2. Go to http://localhost:5000
3. Click "Continue with Google"
4. Sign in with your Google account
5. You should be successfully logged in

## Troubleshooting

**"auth/unauthorized-domain" error:**
- Make sure you've added localhost and your production domains to Firebase Authorized Domains
- Check the exact domain name matches (including http vs https)

**"auth/configuration-not-found" error:**
- Verify your firebase-applet-config.json has valid configuration
- Make sure all required fields are present

**Google popup doesn't open:**
- Check if popup blockers are enabled in your browser
- Try in incognito mode
