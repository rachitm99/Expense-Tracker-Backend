# Database Migration Guide

This guide covers the migration from file-based storage to PostgreSQL + Redis using **standard, vendor-agnostic database clients**.

## Overview

The application has been migrated from local file storage to production databases:
- **PostgreSQL**: User data, transactions, and loans (using standard `pg` client)
- **Redis**: Session management with automatic TTL (using standard `ioredis` client)

**No vendor lock-in**: The code uses industry-standard PostgreSQL and Redis clients that work with **any provider**:
- Self-hosted PostgreSQL
- Managed services (Neon, AWS RDS, Google Cloud SQL, Azure Database, etc.)
- Self-hosted Redis
- Managed Redis (Redis Labs, AWS ElastiCache, Upstash, etc.)

## Architecture Changes

### Before (File Storage)
```
data/
  users.json
  sessions.json
  <userId>/
    transactions.json
    loans.json
    deleted.json
```

### After (Database)
```
PostgreSQL Tables:
  - users
  - transactions
  - loans
  - deleted_items

Redis Keys:
  - session:<sessionId> (auto-expires after 30 days)
```

## Benefits

1. **Persistence**: Data survives deployments on Vercel
2. **Concurrency**: ACID transactions prevent data corruption
3. **Performance**: Indexed queries for fast sync operations
4. **Scalability**: Database handles multiple instances
5. **Security**: Encrypted connections, managed backups
6. **No Vendor Lock-in**: Standard clients work with any PostgreSQL/Redis provider

## Database Clients Used

### PostgreSQL: `pg` (node-postgres)
- **Package**: `pg` ^8.13.1
- **Works with**: Any PostgreSQL server (self-hosted, Neon, AWS RDS, Google Cloud SQL, Azure, etc.)
- **Migration path**: Change `DATABASE_URL` to point to new PostgreSQL server - no code changes needed
- **Standard SQL**: Uses parameterized queries ($1, $2) - industry standard

### Redis: `ioredis`
- **Package**: `ioredis` ^5.4.1
- **Works with**: Any Redis server (self-hosted, Redis Labs, AWS ElastiCache, Upstash, etc.)
- **Migration path**: Change `REDIS_URL` to point to new Redis server - no code changes needed
- **Features**: Connection pooling, automatic reconnection, clustering support

## Setup Instructions

### 1. Install Dependencies

The required packages are already in package.json:

```bash
npm install
```

Dependencies added:
- `pg` - Standard PostgreSQL client for Node.js
- `ioredis` - Standard Redis client with full Redis feature support
- `@types/pg` - TypeScript definitions for pg

### 2. Configure Environment Variables

Your `.env.local` works with **any** PostgreSQL and Redis provider:

```env
# PostgreSQL - Works with ANY provider
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Redis - Works with ANY provider  
REDIS_URL=redis://[username]:password@host:port

# Auth
BETTER_AUTH_SECRET=your-secret-key-here-change-in-production
BETTER_AUTH_URL=http://localhost:3000
```

**Example connection strings for different providers:**

PostgreSQL:
- Neon: `postgresql://user:pass@ep-name.region.aws.neon.tech/db?sslmode=require`
- Self-hosted: `postgresql://user:pass@localhost:5432/expensedb`
- AWS RDS: `postgresql://user:pass@instance.region.rds.amazonaws.com:5432/db`
- Google Cloud SQL: `postgresql://user:pass@host/db?host=/cloudsql/project:region:instance`

Redis:
- Redis Labs: `redis://default:pass@host.cloud.redislabs.com:port`
- Self-hosted: `redis://localhost:6379`
- AWS ElastiCache: `redis://master.cluster.region.cache.amazonaws.com:6379`
- Upstash: `redis://:pass@region.upstash.io:6379`

### 3. Initialize Database Schema

Run the database initialization script:

```bash
npm run db:init
```

This creates:
- **users** table (id, email, password_hash, created_at)
- **transactions** table (id, user_id, amount, category, note, date, etc.)
- **loans** table (id, user_id, name, principal, interest_rate, etc.)
- **deleted_items** table (for tracking deletions in sync)

### 4. Verify Connection

Test database connectivity:

```bash
npm run db:test
```

### 5. Deploy to Vercel

The environment variables are automatically synced in your Vercel project:

```bash
vercel deploy --prod
```

## Code Changes Summary

### lib/storage.ts
- **Before**: File system operations (fs.readFile, fs.writeFile)
- **After**: SQL queries using Neon serverless driver
- All function signatures remain the same (no breaking changes)

Key changes:
```typescript
// Before
export function readTransactions(userId: string): Transaction[] {
  const data = fs.readFileSync(path, 'utf-8');
  return JSON.parse(data);
}

// After
export async function readTransactions(userId: string): Promise<Transaction[]> {
  const result = await sql`
    SELECT * FROM transactions 
    WHERE user_id = ${userId} AND deleted_at IS NULL
  `;
  return result;
}
```

### lib/auth.ts
- **Before**: Sessions stored in sessions.json file
- **After**: Sessions stored in Redis with automatic expiration
- Session TTL: 30 days (managed by Redis)

Key changes:
```typescript
// Before
export function createSession(session: Session): void {
  const sessions = readSessions();
  sessions.push(session);
  writeSessions(sessions);
}

// After
export async function createSession(sessionId: string, data: SessionData): Promise<void> {
  await kv.setex(`session:${sessionId}`, 2592000, JSON.stringify(data));
}
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  note TEXT,
  date TEXT NOT NULL,
  month_key TEXT NOT NULL,
  is_income BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_updated ON transactions(updated_at);
CREATE INDEX idx_transactions_month ON transactions(month_key);
```

### Loans Table
```sql
CREATE TABLE loans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  principal DECIMAL(10, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) NOT NULL,
  duration_months INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  emi_amount DECIMAL(10, 2) NOT NULL,
  total_interest DECIMAL(10, 2) NOT NULL,
  payments JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_loans_user ON loans(user_id);
CREATE INDEX idx_loans_updated ON loans(updated_at);
```

### Deleted Items Table
```sql
CREATE TABLE deleted_items (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deleted_user ON deleted_items(user_id);
CREATE INDEX idx_deleted_at ON deleted_items(deleted_at);
```

## Performance Optimizations

### Indexes
1. **user_id indexes**: Fast filtering by user
2. **updated_at indexes**: Efficient sync queries (fetch changes since timestamp)
3. **month_key index**: Quick filtering by month for transactions
4. **deleted_at index**: Track deletions for sync

### Connection Pooling
Neon uses connection pooling automatically via the `-pooler` endpoint:
```
ep-icy-sunset-a1ceayha-pooler.ap-southeast-1.aws.neon.tech
```

### Session Management
Redis TTL automatically expires sessions after 30 days - no cleanup cron needed.

## Testing

### Test API Endpoints

1. **Register User**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

2. **Login**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

3. **Add Transaction**:
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Authorization: Bearer <session-id>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "category": "Food",
    "note": "Groceries",
    "date": "2024-01-15",
    "monthKey": "2024-01",
    "isIncome": false
  }'
```

### Test Sync Endpoint

```bash
curl http://localhost:3000/api/sync?lastSync=2024-01-01T00:00:00.000Z \
  -H "Authorization: Bearer <session-id>"
```

## Rollback Plan

If you need to rollback to file storage:

1. Restore old `lib/storage.ts` from git history
2. Restore old `lib/auth.ts` from git history
3. Update `.env.local` to use `DATA_PATH=./data`
4. Remove database dependencies from package.json

## Monitoring

### Database Health (Neon)
- Dashboard: https://console.neon.tech
- Monitor connection count, query performance, storage usage

### Redis Health (Vercel KV)
- Dashboard: https://vercel.com/dashboard/stores
- Monitor key count, memory usage, hit rate

## Cost Estimation

### Neon PostgreSQL (Free Tier)
- Storage: 0.5 GB included
- Compute: 191.9 hours/month
- Ideal for development and small apps

### Redis (Vercel KV)
- Free tier: 30MB storage, 100K commands/day
- Sufficient for ~1000 active sessions

### Upgrade Triggers
- PostgreSQL: Upgrade at >500MB data or >100 concurrent connections
- Redis: Upgrade at >30MB or >100K daily commands

## Troubleshooting

### Connection Errors

**Error**: `Connection refused`
- Check `DATABASE_URL` and `REDIS_URL` in `.env.local`
- Verify network connectivity to database servers
- Ensure IP whitelist includes Vercel IPs (Neon: enable "Access from anywhere")

**Error**: `SSL required`
- Neon requires SSL: ensure `sslmode=require` in connection string

### Migration Issues

**Error**: `Table already exists`
- Tables are already created, skip `db:init`
- Or drop existing tables: `DROP TABLE IF EXISTS users CASCADE;`

**Error**: `Syntax error in SQL`
- Check schema.sql for syntax errors
- Run each CREATE statement separately

### Performance Issues

**Slow queries**
- Check indexes are created: `\di` in psql
- Use EXPLAIN ANALYZE for query plans
- Consider adding composite indexes for common queries

**High latency**
- Use connection pooling (already configured)
- Check database region vs Vercel deployment region
- Consider caching frequently accessed data

## Next Steps

1. ✅ Database schema created
2. ✅ Code migrated to PostgreSQL + Redis
3. ⏳ Run `npm run db:init` to initialize database
4. ⏳ Test all API endpoints
5. ⏳ Deploy to Vercel
6. ⏳ Monitor performance in production

## Support

- Neon Docs: https://neon.tech/docs
- Vercel KV Docs: https://vercel.com/docs/storage/vercel-kv
- GitHub Issues: Create an issue for bugs or questions
