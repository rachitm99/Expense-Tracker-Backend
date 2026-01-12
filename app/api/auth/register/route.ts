import { NextResponse } from 'next/server';
import { z } from 'zod';
import { registerUser } from '@/lib/auth';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = registerSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }
    
    const { email, password } = result.data;
    
    // Register user
    const registerResult = await registerUser(email, password);
    
    if (!registerResult.success) {
      return NextResponse.json(
        { error: registerResult.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      userId: registerResult.userId,
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
