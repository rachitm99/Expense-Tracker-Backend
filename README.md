# Expense Tracker - Next.js Backend with Multi-Device Sync

A full-stack Next.js application for tracking expenses and loans with multi-device synchronization. Features PostgreSQL + Redis for production-ready data persistence, secure authentication, and a clean web interface.

## 🌟 Features

- **Authentication**: Secure email/password authentication with Redis session management
- **Transaction Management**: Track income and expenses with categories and notes
- **Loan Tracking**: Manage loans with EMI schedules and payment tracking
- **Multi-Device Sync**: Last-write-wins sync strategy with timestamp-based queries
- **Responsive Web UI**: Clean, minimal design matching Flutter app aesthetics
- **Production Databases**: PostgreSQL (Neon) + Redis (Vercel KV)
- **RESTful API**: Complete API for integration with mobile apps
- **Vercel Ready**: Optimized for serverless deployment

## 📋 Prerequisites

- Node.js 18+ (with npm)
- Git
- PostgreSQL database (any provider: Neon, self-hosted, AWS RDS, etc.)
- Redis instance (any provider: Redis Labs, self-hosted, AWS ElastiCache, etc.)

**No Vendor Lock-in**: Uses standard `pg` and `ioredis` clients that work with any PostgreSQL/Redis provider.

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd Expense-Tracker-Backend
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
REDIS_URL=redis://default:password@host:port

# Better Auth Configuration
BETTER_AUTH_SECRET=your-secret-key-min-32-chars-change-this-in-production
BETTER_AUTH_URL=http://localhost:3000
```

**Your database credentials are already configured in `.env.local`.**

**Important**: Generate a secure random string for `BETTER_AUTH_SECRET`:

```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 3. Initialize Database

Run the database initialization script to create tables and indexes:

```bash
npm run db:init
```

This creates:
- Users table
- Transactions table (with indexes for sync)
- Loans table (with JSONB for payment history)
- Deleted items table (for sync tracking)

### 4. Test Database Connection

Verify your database connections are working:

```bash
npm run db:test
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. First Time Setup

1. Navigate to [http://localhost:3000/auth](http://localhost:3000/auth)
2. Register a new account with email and password
3. Login and start tracking expenses!

## 📁 Project Structure

```
expense-tracker-backend/
├── app/
│   ├── api/
│   │   ├── auth/           # Authentication endpoints
│   │   ├── transactions/   # Transaction CRUD + sync
│   │   ├── loans/          # Loan CRUD + sync
│   │   └── sync/           # Bulk sync endpoint
│   ├── auth/               # Login/Register page
│   ├── loans/              # Loans management page
│   ├── page.tsx            # Dashboard (home)
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
├── lib/
│   ├── auth.ts             # Authentication + Redis sessions
│   ├── storage.ts          # PostgreSQL data layer
│   └── utils.ts            # Helper functions
├── types/
│   └── index.ts            # TypeScript interfaces
├── database/
│   └── schema.sql          # PostgreSQL schema
├── scripts/
│   ├── init-db.ts          # Database initialization
│   └── test-db.ts          # Connection testing
├── docs/
│   ├── API.md              # API documentation
│   ├── MIGRATION.md        # Database migration guide
│   └── ...                 # Other documentation
├── middleware.ts           # Route protection
└── package.json
```

## 🗄️ Database Architecture

### PostgreSQL (Standard `pg` client)
- **Package**: `pg` ^8.13.1 - Works with **any** PostgreSQL server
- **tables**: users, transactions, loans, deleted_items
- **Migration-ready**: Switch providers by changing `DATABASE_URL` - no code changes needed

### Redis (Standard `ioredis` client)
- **Package**: `ioredis` ^5.4.1 - Works with **any** Redis server
- **Keys**: session:{id} with 30-day TTL (auto-expiring)
- **Migration-ready**: Switch providers by changing `REDIS_URL` - no code changes needed

### Performance Features
- Indexed queries on `user_id`, `updated_at`, `month_key`
- Connection pooling (built-in with `pg`)
- Timestamp-based incremental sync
- JSONB for flexible payment history storage

**Easy Migration Path**: The code uses standard SQL and Redis commands. To switch providers:
1. Backup your data
2. Update `DATABASE_URL` and `REDIS_URL` in `.env.local`
3. Run `npm run db:init` on the new server
4. Restore data (if needed)
5. Done! No code changes required

## 🔌 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication

#### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "abc123"
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "session_xyz",
  "userId": "abc123"
}
```

**Note:** Session cookie is automatically set.

#### Get Session

```http
GET /api/auth/session
Cookie: session=session_xyz
```

**Response:**
```json
{
  "authenticated": true,
  "userId": "abc123",
  "email": "user@example.com"
}
```

#### Logout

```http
POST /api/auth/logout
Cookie: session=session_xyz
```

### Transactions

#### Get All Transactions

```http
GET /api/transactions
Cookie: session=session_xyz
```

**Response:**
```json
{
  "transactions": [
    {
      "id": "trans_123",
      "userId": "user_123",
      "amount": 5000,
      "category": "Salary",
      "note": "Monthly salary",
      "date": "2026-01-12T00:00:00.000Z",
      "monthKey": "2026-01",
      "isIncome": true,
      "createdAt": "2026-01-12T10:30:00.000Z",
      "updatedAt": "2026-01-12T10:30:00.000Z"
    }
  ]
}
```

#### Add Transaction

```http
POST /api/transactions
Cookie: session=session_xyz
Content-Type: application/json

{
  "amount": 5000,
  "category": "Salary",
  "note": "Monthly salary",
  "date": "2026-01-12T00:00:00.000Z",
  "isIncome": true
}
```

#### Update Transaction

```http
PUT /api/transactions
Cookie: session=session_xyz
Content-Type: application/json

{
  "id": "trans_123",
  "amount": 5500,
  "category": "Salary",
  "note": "Updated salary",
  "date": "2026-01-12T00:00:00.000Z",
  "isIncome": true
}
```

#### Delete Transaction

```http
DELETE /api/transactions/{id}
Cookie: session=session_xyz
```

#### Sync Transactions

```http
GET /api/transactions/sync?lastSync=2026-01-11T00:00:00.000Z
Cookie: session=session_xyz
```

**Response:**
```json
{
  "transactions": [...],
  "deleted": ["trans_456"],
  "syncTimestamp": "2026-01-12T12:00:00.000Z"
}
```

### Loans

#### Get All Loans

```http
GET /api/loans
Cookie: session=session_xyz
```

#### Add Loan

```http
POST /api/loans
Cookie: session=session_xyz
Content-Type: application/json

{
  "name": "Home Loan",
  "principal": 1000000,
  "interestRate": 8.5,
  "durationMonths": 240,
  "startDate": "2026-01-01T00:00:00.000Z"
}
```

**Response:** Automatically calculates EMI amount and total interest.

#### Update Loan

```http
PUT /api/loans
Cookie: session=session_xyz
Content-Type: application/json

{
  "id": "loan_123",
  "name": "Home Loan Updated",
  ...
}
```

#### Mark EMI as Paid

```http
POST /api/loans/{loanId}/pay
Cookie: session=session_xyz
Content-Type: application/json

{
  "monthNumber": 1
}
```

#### Delete Loan

```http
DELETE /api/loans/{id}
Cookie: session=session_xyz
```

#### Sync Loans

```http
GET /api/loans/sync?lastSync=2026-01-11T00:00:00.000Z
Cookie: session=session_xyz
```

### Bulk Sync

**The main endpoint for mobile app synchronization.**

```http
POST /api/sync
Cookie: session=session_xyz
Content-Type: application/json

{
  "lastSyncTimestamp": "2026-01-11T00:00:00.000Z",
  "changes": {
    "transactions": {
      "new": [...],
      "updated": [...],
      "deleted": ["id1", "id2"]
    },
    "loans": {
      "new": [...],
      "updated": [...],
      "deleted": ["id3"]
    }
  }
}
```

**Response:**
```json
{
  "syncTimestamp": "2026-01-12T12:00:00.000Z",
  "changes": {
    "transactions": [...],
    "loans": [...],
    "deletedTransactions": ["id4"],
    "deletedLoans": ["id5"]
  }
}
```

## 🔐 Authentication Flow

### For Web App

1. User registers/logs in via `/auth` page
2. Session cookie is set automatically
3. Cookie is sent with all subsequent requests
4. Middleware protects routes requiring authentication

### For Mobile App (Flutter)

1. Call `POST /api/auth/login` with credentials
2. Extract `sessionId` from response
3. Store `sessionId` locally (SharedPreferences/Hive)
4. Include in requests as `Authorization: Bearer {sessionId}` header

**Example (Flutter/Dart):**

```dart
// Login
final response = await http.post(
  Uri.parse('$baseUrl/api/auth/login'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({'email': email, 'password': password}),
);

final data = jsonDecode(response.body);
final sessionId = data['sessionId'];

// Store session
await prefs.setString('sessionId', sessionId);

// Use in requests
final headers = {
  'Authorization': 'Bearer $sessionId',
  'Content-Type': 'application/json',
};

final transactions = await http.get(
  Uri.parse('$baseUrl/api/transactions'),
  headers: headers,
);
```

## 🔄 Sync Strategy

### Last-Write-Wins Conflict Resolution

1. **Client sends:**
   - Last sync timestamp
   - All local changes since last sync (new, updated, deleted items)

2. **Server processes:**
   - Applies client changes to server storage
   - Retrieves all server changes since client's last sync timestamp

3. **Server responds:**
   - New sync timestamp
   - All server changes (for client to apply)

4. **Client applies:**
   - Server changes overwrite local data (last-write-wins)
   - Updates local sync timestamp

### Sync Implementation (Flutter)

```dart
Future<void> syncData() async {
  final lastSync = await getLastSyncTimestamp();
  
  // Gather local changes
  final localChanges = await getLocalChangesSince(lastSync);
  
  // Send to server
  final response = await http.post(
    Uri.parse('$baseUrl/api/sync'),
    headers: {
      'Authorization': 'Bearer $sessionId',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'lastSyncTimestamp': lastSync,
      'changes': localChanges,
    }),
  );
  
  final serverChanges = jsonDecode(response.body);
  
  // Apply server changes (server wins)
  await applyServerChanges(serverChanges['changes']);
  
  // Update sync timestamp
  await saveLastSyncTimestamp(serverChanges['syncTimestamp']);
}
```

## 🚢 Deployment

### Vercel (Recommended)

#### Important: Data Persistence Limitation

⚠️ **Vercel's filesystem is ephemeral** - data will be lost on each deployment. For production use, choose one of these options:

**Option 1: Use Vercel KV (Redis)**

Install Vercel KV and modify storage layer to use Redis instead of files.

```bash
npm install @vercel/kv
```

**Option 2: Use Turso (Serverless SQLite)**

Replace file storage with Turso for persistent SQLite database.

```bash
npm install @libsql/client
```

**Option 3: Self-Host with Persistent Storage**

Deploy to a VPS with mounted persistent volumes.

#### Deploy to Vercel

1. **Install Vercel CLI:**

```bash
npm install -g vercel
```

2. **Deploy:**

```bash
vercel
```

3. **Set Environment Variables:**

Go to Vercel Dashboard → Project → Settings → Environment Variables

Add:
- `BETTER_AUTH_SECRET`: Your secure secret key
- `BETTER_AUTH_URL`: Your production URL (e.g., `https://your-app.vercel.app`)
- `DATA_PATH`: `./data` (or adjust based on storage solution)

4. **Redeploy:**

```bash
vercel --prod
```

### Self-Hosting (Docker)

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t expense-tracker .
docker run -p 3000:3000 \
  -e BETTER_AUTH_SECRET=your-secret \
  -e BETTER_AUTH_URL=http://localhost:3000 \
  -v $(pwd)/data:/app/data \
  expense-tracker
```

**Note:** Use `-v` to mount persistent volume for data storage.

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `BETTER_AUTH_SECRET` | ✅ Yes | Secret key for session encryption (min 32 chars) | - |
| `BETTER_AUTH_URL` | ✅ Yes | Base URL of the application | - |
| `DATA_PATH` | ❌ No | Path to data storage directory | `./data` |

### Customization

#### Change Session Duration

Edit [lib/auth.ts](lib/auth.ts):

```typescript
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
```

#### Add More Fields to Transactions

1. Update [types/index.ts](types/index.ts)
2. Update validation schemas in API routes
3. Update UI forms

## 🧪 Testing

### Test API with cURL

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}' \
  -c cookies.txt
```

**Get Transactions:**
```bash
curl http://localhost:3000/api/transactions \
  -b cookies.txt
```

## 📱 Flutter Integration

### Setup

1. Add `http` package to `pubspec.yaml`
2. Create API service class
3. Implement sync logic

### Example API Service

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class ApiService {
  final String baseUrl = 'https://your-app.vercel.app';
  String? sessionId;
  
  Future<bool> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      sessionId = data['sessionId'];
      return true;
    }
    return false;
  }
  
  Future<List<Transaction>> getTransactions() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/transactions'),
      headers: {'Authorization': 'Bearer $sessionId'},
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return (data['transactions'] as List)
          .map((e) => Transaction.fromJson(e))
          .toList();
    }
    throw Exception('Failed to load transactions');
  }
  
  Future<SyncResponse> syncAll(SyncRequest request) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/sync'),
      headers: {
        'Authorization': 'Bearer $sessionId',
        'Content-Type': 'application/json',
      },
      body: jsonEncode(request.toJson()),
    );
    
    if (response.statusCode == 200) {
      return SyncResponse.fromJson(jsonDecode(response.body));
    }
    throw Exception('Sync failed');
  }
}
```

## 🐛 Troubleshooting

### "Unauthorized" errors

- Ensure session cookie is being sent
- Check if session has expired (30-day default)
- Verify `BETTER_AUTH_SECRET` is set correctly

### Data not persisting

- Check `DATA_PATH` environment variable
- Ensure write permissions on data directory
- On Vercel: Remember filesystem is ephemeral

### Build errors

- Delete `.next` folder and `node_modules`
- Run `npm install` again
- Check Node.js version (18+ required)

### CORS errors (when calling from mobile app)

Add CORS headers in [next.config.ts](next.config.ts):

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

## 📊 Data Storage Format

### users.json
```json
[
  {
    "id": "user_123",
    "email": "user@example.com",
    "passwordHash": "$2a$10$...",
    "createdAt": "2026-01-12T10:00:00.000Z"
  }
]
```

### sessions.json
```json
[
  {
    "id": "session_xyz",
    "userId": "user_123",
    "expiresAt": "2026-02-11T10:00:00.000Z",
    "createdAt": "2026-01-12T10:00:00.000Z"
  }
]
```

### data/users/{userId}/transactions.json
```json
[
  {
    "id": "trans_123",
    "userId": "user_123",
    "amount": 5000,
    "category": "Salary",
    "note": "Monthly salary",
    "date": "2026-01-12T00:00:00.000Z",
    "monthKey": "2026-01",
    "isIncome": true,
    "createdAt": "2026-01-12T10:30:00.000Z",
    "updatedAt": "2026-01-12T10:30:00.000Z"
  }
]
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Built with Next.js 15
- Authentication with custom implementation (bcryptjs)
- UI styled with Tailwind CSS
- Icons from Lucide React

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review API documentation above
3. Open an issue on GitHub

---

**Happy Tracking! 💰**
