import { Client } from 'pg';
import Redis from 'ioredis';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '..', '.env.local') });

async function testDatabase() {
  console.log('🔍 Testing Database Connections\n');
  
  // Test PostgreSQL
  console.log('1. Testing PostgreSQL...');
  const pgClient = new Client({
    connectionString: process.env.DATABASE_URL!,
    ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
  });
  
  try {
    await pgClient.connect();
    const result = await pgClient.query('SELECT NOW() as current_time');
    console.log('   ✅ PostgreSQL connected successfully');
    console.log(`   ⏰ Server time: ${result.rows[0].current_time}`);
    
    // Check if tables exist
    const tables = await pgClient.query(
      `SELECT tablename FROM pg_tables 
       WHERE schemaname = 'public'
       ORDER BY tablename`
    );
    
    if (tables.rows.length > 0) {
      console.log('   📊 Tables found:');
      tables.rows.forEach(t => console.log(`      - ${t.tablename}`));
    } else {
      console.log('   ⚠️  No tables found. Run: npm run db:init');
    }
  } catch (error) {
    console.error('   ❌ PostgreSQL connection failed:');
    console.error('   ', error);
    process.exit(1);
  } finally {
    await pgClient.end();
  }
  
  console.log('');
  
  // Test Redis
  console.log('2. Testing Redis...');
  const redis = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });
  
  try {
    const testKey = 'test:connection';
    const testValue = { timestamp: new Date().toISOString() };
    
    // Write test
    await redis.setex(testKey, 10, JSON.stringify(testValue));
    console.log('   ✅ Redis write successful');
    
    // Read test
    const readValue = await redis.get(testKey);
    console.log('   ✅ Redis read successful');
    
    // Cleanup
    await redis.del(testKey);
    console.log('   ✅ Redis delete successful');
    
    // Check active sessions
    const sessionKeys = await redis.keys('session:*');
    console.log(`   📊 Active sessions: ${sessionKeys.length}`);
    
  } catch (error) {
    console.error('   ❌ Redis connection failed:');
    console.error('   ', error);
    process.exit(1);
  } finally {
    await redis.quit();
  }
  
  console.log('');
  console.log('✨ All database connections working!');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Run: npm run db:init (if tables not created)');
  console.log('  2. Start dev server: npm run dev');
  console.log('  3. Test API endpoints in browser or with curl');
}

testDatabase().then(() => {
  process.exit(0);
});
