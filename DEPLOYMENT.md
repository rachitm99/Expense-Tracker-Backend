# Deployment Guide - Vercel

Complete guide for deploying your Expense Tracker backend to Vercel with custom domain **etb.wahr.in**.

## 🌐 Custom Domain Setup

This project is configured for: **https://etb.wahr.in**

### Configure Domain in Vercel

1. Go to your Vercel project → **Settings** → **Domains**
2. Add domain: `etb.wahr.in`
3. Configure DNS at your domain provider (Wahr):
   ```
   Type: CNAME
   Name: etb
   Value: cname.vercel-dns.com
   ```
4. Wait 5-10 minutes for DNS propagation
5. Vercel auto-issues SSL certificate

### Production Environment Variable

Ensure this is set in Vercel:
```
BETTER_AUTH_URL=https://etb.wahr.in
```

## ⚠️ Important: Data Persistence

**Note:** This project now uses PostgreSQL + Redis (not filesystem), so data persists across deployments.

### Recommended Solutions

#### Option 1: Vercel KV (Redis) - Recommended

Best for production use with Vercel.

**Steps:**

1. Install Vercel KV in your project dashboard
2. Install the package:
```bash
npm install @vercel/kv
```

3. Update `lib/storage.ts` to use Redis instead of files
4. Environment variables are set automatically by Vercel

**Cost:** Free tier available, then pay-as-you-go

#### Option 2: Turso (Serverless SQLite)

Persistent SQLite database in the cloud.

**Steps:**

1. Create account at [turso.tech](https://turso.tech)
2. Install package:
```bash
npm install @libsql/client
```

3. Update storage layer to use SQLite
4. Add Turso connection string to environment variables

**Cost:** Free tier available

#### Option 3: Self-Host with Persistent Storage

Deploy to a VPS with persistent volumes.

See "Self-Hosting" section below.

---

## Deploying to Vercel

### Prerequisites

- GitHub account
- Vercel account (sign up at [vercel.com](https://vercel.com))

### Method 1: Deploy via Vercel Dashboard (Easiest)

1. **Push code to GitHub:**

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/expense-tracker-backend.git
git push -u origin main
```

2. **Import to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Environment Variables:**

In the configuration screen, add:

| Name | Value |
|------|-------|
| `BETTER_AUTH_SECRET` | Your secure random secret (min 32 chars) |
| `BETTER_AUTH_URL` | `https://etb.wahr.in` |
| `DATABASE_URL` | Your PostgreSQL connection string (from Neon) |
| `REDIS_URL` | Your Redis connection string (from Redis Labs) |

**Generate secret:**
```bash
openssl rand -base64 32
```

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete (~2 minutes)
   - Your app will be live at https://etb.wahr.in (after domain setup)

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI:**

```bash
npm install -g vercel
```

2. **Login:**

```bash
vercel login
```

3. **Deploy:**

```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? Choose your account
- Link to existing project? **No**
- Project name? **expense-tracker-backend**
- Directory? **./** (press Enter)
- Override settings? **No**

4. **Set Environment Variables:**

```bash
vercel env add BETTER_AUTH_SECRET
# Paste your secret when prompted

vercel env add BETTER_AUTH_URL
# Enter: https://etb.wahr.in

vercel env add DATABASE_URL
# Paste your PostgreSQL connection string

vercel env add REDIS_URL
# Paste your Redis connection string
```

5. **Deploy to Production:**

```bash
vercel --prod
```

6. **Configure Custom Domain:**
   - Go to Vercel dashboard → Settings → Domains
   - Add `etb.wahr.in`
   - Update DNS as shown above

---

## Post-Deployment

### 1. Test Your API

Visit your deployment URL:

```
https://your-project-name.vercel.app
```

You should be redirected to `/auth`.

### 2. Test API Endpoints

**Health Check:**
```bash
curl https://your-project-name.vercel.app/api/auth/session
```

Should return:
```json
{"error": "Unauthorized"}
```

**Register:**
```bash
curl -X POST https://your-project-name.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```

### 3. Update Flutter App

Update your Flutter app's base URL:

```dart
class ApiConfig {
  static const String baseUrl = 'https://your-project-name.vercel.app/api';
}
```

---

## Continuous Deployment

Once connected to GitHub, Vercel automatically:
- Deploys on every push to `main` branch
- Creates preview deployments for pull requests
- Runs builds and tests

### Workflow

1. Make changes locally
2. Commit and push to GitHub
3. Vercel automatically deploys
4. Check deployment status in Vercel dashboard

---

## Custom Domain

### Add Custom Domain

1. Go to Project Settings → Domains
2. Add your domain (e.g., `api.myexpensetracker.com`)
3. Follow DNS configuration instructions
4. Update `BETTER_AUTH_URL` environment variable:

```bash
vercel env add BETTER_AUTH_URL production
# Enter: https://api.myexpensetracker.com
```

5. Redeploy:

```bash
vercel --prod
```

---

## Environment Variables Management

### View Variables

```bash
vercel env ls
```

### Add Variable

```bash
vercel env add VARIABLE_NAME
```

Select environment:
- Production
- Preview
- Development

### Remove Variable

```bash
vercel env rm VARIABLE_NAME
```

### Update Variable

Remove old value and add new:

```bash
vercel env rm BETTER_AUTH_SECRET production
vercel env add BETTER_AUTH_SECRET production
```

---

## Monitoring & Logs

### View Logs

**Dashboard:**
- Go to your project
- Click on a deployment
- Click "Functions" tab
- Select a function to view logs

**CLI:**
```bash
vercel logs
```

### Monitor Performance

Vercel Analytics (optional):
1. Go to Project Settings → Analytics
2. Enable Analytics
3. Add to your app:

```bash
npm install @vercel/analytics
```

Update `app/layout.tsx`:

```tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

---

## Troubleshooting

### Build Fails

**Check build logs:**
- Go to deployment in dashboard
- View build logs
- Look for errors

**Common issues:**
- TypeScript errors: Fix type issues locally first
- Missing dependencies: Ensure `package.json` is correct
- Environment variables: Check they're set correctly

### "Unauthorized" Errors After Deployment

**Check:**
1. `BETTER_AUTH_SECRET` is set
2. `BETTER_AUTH_URL` matches your deployment URL
3. Session cookies are being sent (use browser DevTools)

### Data Not Persisting

**This is expected with file-based storage on Vercel!**

Solutions:
- Implement Vercel KV (Option 1 above)
- Use Turso (Option 2 above)
- Self-host (Option 3 above)

### CORS Errors (Mobile App)

Add CORS headers in `next.config.ts`:

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
};
```

Redeploy after changes.

---

## Self-Hosting Alternatives

### Option 1: DigitalOcean App Platform

1. Push to GitHub
2. Create new app in DigitalOcean
3. Connect GitHub repo
4. Set environment variables
5. Deploy

**Cost:** ~$5/month

### Option 2: Railway

1. Push to GitHub
2. Create new project in Railway
3. Connect repo
4. Set environment variables
5. Deploy

**Cost:** Free tier available

### Option 3: VPS (DigitalOcean, Linode, AWS EC2)

**Docker Deployment:**

1. Create `Dockerfile` (already in project)

2. Build image:
```bash
docker build -t expense-tracker .
```

3. Run container:
```bash
docker run -d -p 3000:3000 \
  -e BETTER_AUTH_SECRET=your-secret \
  -e BETTER_AUTH_URL=https://your-domain.com \
  -v /path/on/host/data:/app/data \
  --name expense-tracker \
  expense-tracker
```

4. Set up reverse proxy (Nginx):

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. Enable HTTPS with Let's Encrypt:
```bash
certbot --nginx -d api.yourdomain.com
```

**Cost:** ~$5-10/month

---

## Scaling

### Vercel Automatic Scaling

Vercel handles scaling automatically:
- No configuration needed
- Scales to zero when not in use
- Scales up based on traffic

### Performance Tips

1. **Enable caching:**
   - Add cache headers to API responses
   - Use Vercel Edge Cache for static assets

2. **Optimize API responses:**
   - Return only necessary data
   - Use pagination for large datasets

3. **Monitor function execution:**
   - Keep functions under 10s execution time
   - Optimize database queries

---

## Security Best Practices

### 1. Rotate Secrets Regularly

Update `BETTER_AUTH_SECRET` periodically:

```bash
vercel env rm BETTER_AUTH_SECRET production
vercel env add BETTER_AUTH_SECRET production
# Enter new secret
vercel --prod
```

**Note:** This invalidates all existing sessions.

### 2. Use HTTPS Only

Vercel enforces HTTPS automatically. Never use `http://` URLs in production.

### 3. Rate Limiting

Consider adding rate limiting middleware:

```bash
npm install express-rate-limit
```

### 4. Input Validation

All inputs are validated with Zod. Review validation schemas regularly.

---

## Cost Estimates

### Vercel Free Tier

- Unlimited deployments
- 100 GB bandwidth/month
- Serverless function execution included
- **Sufficient for personal use and testing**

### Vercel Pro ($20/month)

- 1 TB bandwidth/month
- Advanced analytics
- Team features
- **Good for production apps**

### Vercel KV Pricing

- Free: 256 MB storage, 10K commands/day
- Pro: Pay-as-you-go after free tier

---

## Backup & Recovery

### Export Data (Development)

```bash
# Backup data directory
tar -czf backup-$(date +%Y%m%d).tar.gz data/
```

### Production with Vercel KV

Implement periodic backups:

```typescript
// Add to cron job or manual endpoint
export async function backupData() {
  // Export from Vercel KV
  // Store in S3, Dropbox, etc.
}
```

---

## Support Resources

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Vercel Support**: support@vercel.com
- **Community**: [GitHub Discussions](https://github.com/vercel/next.js/discussions)

---

**Ready to Deploy? Follow the steps above and your app will be live in minutes!** 🚀
