# Custom Domain Setup Guide for whogohost.com

## Step 1: Get DNS Records from Render

1. Go to [Render.com](https://render.com)
2. Navigate to your "kosibills" service
3. Click on the "Settings" tab
4. Scroll to "Custom Domains" section
5. Click "Add Custom Domain"
6. Enter your domain name (e.g., `kosibills.com` or `app.kosibills.com`)
7. Render will display the DNS records you need to add:
   - **A Record** (for root domain): Points to an IP address
   - **CNAME Record** (for subdomains): Points to `your-service-name.onrender.com`

**Copy these values - you'll need them in the next step.**

## Step 2: Configure DNS on whogohost.com

1. Log in to your [whogohost.com](https://whogohost.com) account
2. Click on "My Domains" in the menu
3. Find your domain and click "Manage"
4. Look for "DNS Management" or "DNS Zone Editor"
5. Click to add a new record

### For Root Domain (e.g., kosibills.com):

**Add an A Record:**
- **Type**: A
- **Host/Name**: @
- **Value/Points to**: [Paste the IP address from Render]
- **TTL**: 3600

### For Subdomain (e.g., app.kosibills.com):

**Add a CNAME Record:**
- **Type**: CNAME
- **Host/Name**: app
- **Value/Points to**: [Paste your service name].onrender.com
- **TTL**: 3600

6. Click "Save" or "Add Record"

## Step 3: Wait for DNS Propagation

- DNS changes typically take 10 minutes to 48 hours to propagate
- You can check propagation status at: https://dnschecker.org
- Render will automatically provision an SSL certificate once DNS propagates

## Step 4: Verify

1. Go back to Render dashboard
2. Your custom domain should show as "Active" once DNS propagates
3. Visit your domain (e.g., https://kosibills.com) to verify it works
4. The site should load with HTTPS automatically

## Troubleshooting

- **Domain not working**: Wait longer for DNS propagation (up to 48 hours)
- **SSL not working**: Render provisions SSL automatically - wait a few more hours
- **Wrong site loading**: Double-check your DNS records match Render's instructions exactly

## Need Help?

If you're stuck, share:
1. Your domain name
2. The DNS records Render provided
3. A screenshot of your whogohost DNS settings

I can help you verify the configuration.
