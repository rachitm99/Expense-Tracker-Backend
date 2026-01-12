import bcrypt from 'bcryptjs';
import Redis from 'ioredis';
import { generateId } from './utils';
import { getUserByEmail, createUser, getUserById } from './storage';
import { User } from '@/types';

const SESSION_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function registerUser(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; userId?: string }> {
  // Check if user exists
  const existing = await getUserByEmail(email);
  
  if (existing) {
    return { success: false, error: 'Email already registered' };
  }
  
  // Validate email
  if (!email.includes('@')) {
    return { success: false, error: 'Invalid email format' };
  }
  
  // Validate password
  if (password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters' };
  }
  
  // Create user
  const passwordHash = await hashPassword(password);
  const user = {
    id: generateId(),
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  
  await createUser(user);
  
  return { success: true, userId: user.id };
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; sessionId?: string; userId?: string }> {
  // Find user
  const user = await getUserByEmail(email);
  
  if (!user) {
    return { success: false, error: 'Invalid email or password' };
  }
  
  // Verify password
  const valid = await verifyPassword(password, user.password_hash);
  
  if (!valid) {
    return { success: false, error: 'Invalid email or password' };
  }
  
  // Create session
  const sessionId = generateId();
  const sessionData = {
    id: sessionId,
    userId: user.id,
    email: user.email,
    createdAt: new Date().toISOString(),
  };
  
  // Store in Redis with TTL
  await redis.setex(`session:${sessionId}`, SESSION_DURATION, JSON.stringify(sessionData));
  
  return { success: true, sessionId: sessionId, userId: user.id };
}

export async function getSession(sessionId: string): Promise<{ id: string; userId: string; email: string; createdAt: string } | null> {
  const sessionData = await redis.get(`session:${sessionId}`);
  
  if (!sessionData) {
    return null;
  }
  
  return JSON.parse(sessionData);
}

export async function logoutUser(sessionId: string): Promise<void> {
  await redis.del(`session:${sessionId}`);
}

export async function getUserFromSession(sessionId: string): Promise<User | null> {
  const session = await getSession(sessionId);
  
  if (!session) return null;
  
  const user = await getUserById(session.userId);
  
  return user || null;
}

export function getSessionFromRequest(request: Request): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check cookie
  const cookies = request.headers.get('Cookie');
  if (cookies) {
    const sessionCookie = cookies
      .split(';')
      .find(c => c.trim().startsWith('session='));
    
    if (sessionCookie) {
      return sessionCookie.split('=')[1];
    }
  }
  
  return null;
}

export async function requireAuth(request: Request): Promise<{ userId: string; user: User } | null> {
  const sessionId = getSessionFromRequest(request);
  
  if (!sessionId) return null;
  
  const user = await getUserFromSession(sessionId);
  
  if (!user) return null;
  
  return { userId: user.id, user };
}
