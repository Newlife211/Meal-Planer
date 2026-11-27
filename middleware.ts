import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        if (
          pathname.startsWith('/login') ||
          pathname.startsWith('/signup') ||
          pathname.startsWith('/forgot-password') ||
          pathname.startsWith('/reset-password') ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/api/signup') ||
          pathname.startsWith('/api/telegram') ||
          pathname.startsWith('/api/demo-plan') ||
          pathname.startsWith('/api/track') ||
          pathname.startsWith('/api/geo') ||
          pathname.startsWith('/terms') ||
          pathname.startsWith('/privacy') ||
          pathname.startsWith('/refund') ||
          pathname.startsWith('/faq') ||
          pathname.startsWith('/blog') ||
          pathname.startsWith('/meal-plans') ||
          pathname.startsWith('/landing') ||
          pathname === '/robots.txt' ||
          pathname === '/sitemap.xml' ||
          pathname === '/'
        ) {
          return true;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.svg|og-image\\.png|api/auth|api/signup|api/telegram|api/demo-plan|api/track|api/geo).*)',
  ],
};
