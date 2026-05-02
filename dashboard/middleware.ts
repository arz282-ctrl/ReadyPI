import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Middleware — Route Protection
 *
 * Redirects unauthenticated users away from protected routes.
 * Checks for the readypi_session cookie (set during login/exchange).
 *
 * Protected routes: /dashboard, /billing, /checkout
 * Public routes: /, /login, /signup, /pricing, /docs, /playground, /models, /api/*
 *
 * NOTE: The cookie is a JWT but we do NOT verify it here (no secret in Edge).
 * The backend verifies the JWT on every API call. The cookie is only a
 * gate-check to prevent SSR of protected pages for unauthenticated visitors.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define protected route prefixes
  const protectedPrefixes = ['/dashboard', '/billing', '/checkout'];

  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check for server-side session cookie
  const sessionCookie = request.cookies.get('readypi_session');

  if (!sessionCookie?.value) {
    // Redirect to login with the intended destination as a query param
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Basic JWT structure validation (3 dot-separated base64 segments)
  // This prevents malformed cookies from granting access to protected pages
  const parts = sessionCookie.value.split('.');
  if (parts.length !== 3) {
    // Invalid JWT format — clear the cookie and redirect
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set('readypi_session', '', { path: '/', maxAge: 0 });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, icons, images
     * - API routes (handled by their own auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)',
  ],
};
