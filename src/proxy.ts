import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  const { pathname } = request.nextUrl;

  // 如果访问登录页且已登录，跳转到首页
  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 如果访问后台页面且未登录，跳转到登录页
  if (pathname !== '/login' && !pathname.startsWith('/api/auth') && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * 1. /api/auth/* (登录接口)
     * 2. /_next/* (Next.js 内部文件)
     * 3. /static/* (静态文件)
     * 4. /favicon.ico, /vercel.svg, 等 (公共文件)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.svg$).*)',
  ],
};
