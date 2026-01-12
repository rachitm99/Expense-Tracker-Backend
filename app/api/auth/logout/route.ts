import { NextResponse } from 'next/server';
import { getSessionFromRequest, logoutUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const sessionId = getSessionFromRequest(request);
    
    if (sessionId) {
      logoutUser(sessionId);
    }
    
    const response = NextResponse.json({ success: true });
    
    // Clear session cookie
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
