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
  if (pathname === '/' || pathname.startsWith('/loans')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/loans/:path*', '/api/transactions/:path*', '/api/loans/:path*', '/api/sync/:path*'],
};
