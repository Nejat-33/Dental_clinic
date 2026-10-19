import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const isLogin = request.nextUrl.pathname === '/admin/login';

  // Only checks that a session cookie exists, to avoid showing the panel shell to anonymous visitors.
  // The real security is the backend: every admin API route verifies the token itself.
  if (!isLogin && !request.cookies.has('token')) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };