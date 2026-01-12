import { NextResponse } from 'next/server';
import { z } from 'zod';
import { loginUser } from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = loginSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }
    
    const { email, password } = result.data;
    
    // Login user
    const loginResult = await loginUser(email, password);
    
    if (!loginResult.success) {
      return NextResponse.json(
        { error: loginResult.error },
        { status: 401 }
      );
    }
    
    // Set session cookie
    const response = NextResponse.json({
      success: true,
      sessionId: loginResult.sessionId,
      userId: loginResult.userId,
    });
    
    response.cookies.set('session', loginResult.sessionId!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
