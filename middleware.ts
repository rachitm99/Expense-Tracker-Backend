import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  // Public routes
  if (pathname.startsWith('/api/auth') || pathname === '/auth') {
    return NextResponse.next();
  }

  // Protected routes
  if (pathname === '/') {
    if (!session) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/api/transactions/:path*', '/api/sync/:path*'],
};
