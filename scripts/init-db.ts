import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '..', '.env.local') });

async function initDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable not set');
    process.exit(1);
  }
  
  console.log('🔄 Connecting to database...');
  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
  });
  
  await client.connect();
  
  try {
    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    console.log('🔄 Creating tables...');
    
    // Split by semicolon and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      await client.query(statement);
    }
    
    console.log('✅ Database initialized successfully!');
    console.log('');
    console.log('Tables created:');
    console.log('  - users');
    console.log('  - transactions');
    console.log('  - loans');
    console.log('  - deleted_items');
    console.log('');
    console.log('Indexes created for optimal query performance');
    
  } catch (error) {
    console.error('❌ Database initialization failed:');
    console.error(error);
    await client.end();
    process.exit(1);
  }
  
  await client.end();
}

// Run initialization
initDatabase().then(() => {
  process.exit(0);
});
