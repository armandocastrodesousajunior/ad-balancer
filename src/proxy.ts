import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  // Only protect /admin and subpaths, except the login page itself
  if (request.nextUrl.pathname.startsWith('/admin') && request.nextUrl.pathname !== '/admin') {
    const tokenCookie = request.cookies.get('admin_token')?.value;
    
    // We can't read process.env.ADMIN_TOKEN directly if it's dynamic, 
    // but in Edge runtime it's available via process.env
    const validToken = process.env.ADMIN_TOKEN;

    if (!tokenCookie || tokenCookie !== validToken) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
