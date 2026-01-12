# Quick Start Guide

Get your Expense Tracker backend running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Terminal/Command Prompt access

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including Next.js, TypeScript, Tailwind CSS, and authentication libraries.

### 2. Create Environment File

Copy the example environment file:

```bash
# Windows (PowerShell)
Copy-Item .env.local.example .env.local

# Linux/Mac
cp .env.local.example .env.local
```

Edit `.env.local` and replace the placeholder secret:

```env
BETTER_AUTH_SECRET=your-secret-key-min-32-chars-change-this-in-production
BETTER_AUTH_URL=http://localhost:3000
DATA_PATH=./data
```

**Generate a secure secret:**

```bash
# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Linux/Mac
openssl rand -base64 32
```

### 3. Start Development Server

```bash
npm run dev
```

You should see:

```
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
  - Ready in 2.3s
```

### 4. Open in Browser

Navigate to [http://localhost:3000](http://localhost:3000)

You'll be redirected to the login page.

### 5. Create Your Account

1. Click "Don't have an account? Register"
2. Enter your email and password (min 8 characters)
3. Click "Register"
4. Login with your credentials

### 6. Start Tracking!

- Click **"Add Income"** (green) to record income
- Click **"Add Expense"** (red) to record expenses
- Navigate to **"Loans"** to manage loans and EMIs

## Testing the API

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"testpass123\"}"
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"testpass123\"}" \
  -c cookies.txt
```

**Get Transactions:**
```bash
curl http://localhost:3000/api/transactions -b cookies.txt
```

### Using Postman/Insomnia

1. Import the API collection (see [API.md](API.md))
2. Create an environment with base URL: `http://localhost:3000/api`
3. Start testing endpoints

## File Structure

```
Expense-Tracker-Backend/
├── app/
│   ├── api/              # API routes
│   ├── auth/             # Auth page
│   ├── loans/            # Loans page
│   └── page.tsx          # Dashboard
├── lib/
│   ├── auth.ts           # Authentication logic
│   ├── storage.ts        # File storage
│   └── utils.ts          # Helper functions
├── data/                 # Created automatically
│   ├── users.json
│   ├── sessions.json
│   └── users/
│       └── {userId}/
│           ├── transactions.json
│           ├── loans.json
│           └── deleted.json
├── .env.local            # Your environment variables
└── package.json
```

## Common Issues

### Port 3000 already in use

```bash
# Find and kill the process (Windows PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Or use a different port
npm run dev -- -p 3001
```

### Module not found errors

```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### Build errors

```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

## Next Steps

1. **Read the full documentation**: [README.md](README.md)
2. **Explore the API**: [API.md](API.md)
3. **Deploy to production**: See deployment section in README
4. **Integrate with Flutter app**: Follow Flutter integration guide in README

## Key Features to Try

### Dashboard
- View total wealth (income - expenses)
- See all transactions grouped by month
- Add income/expense with categories and notes

### Loans Page
- Create loans with automatic EMI calculation
- Track payment progress
- Mark EMIs as paid
- View next EMI due date with urgency indicators

### Sync API
- Test multi-device sync via `/api/sync` endpoint
- Perfect for integrating with mobile apps

## Development Tips

### Hot Reload

Next.js automatically reloads when you edit files. Just save and refresh!

### TypeScript

All code is fully typed. Your IDE will provide autocomplete and type checking.

### Tailwind CSS

Use Tailwind utility classes for styling. See [Tailwind docs](https://tailwindcss.com/docs).

### File Storage

Data is stored in JSON files in the `data/` folder. You can inspect them directly.

## Production Checklist

Before deploying:

- [ ] Generate a strong `BETTER_AUTH_SECRET`
- [ ] Set correct `BETTER_AUTH_URL` for production
- [ ] Choose a persistence strategy (Vercel KV, Turso, or self-host)
- [ ] Test all API endpoints
- [ ] Set up CORS if needed for mobile apps
- [ ] Enable HTTPS (handled by Vercel automatically)

## Getting Help

- **Documentation**: Check [README.md](README.md)
- **API Reference**: See [API.md](API.md)
- **Issues**: Open an issue on GitHub

---

**Happy Tracking! 🚀**
