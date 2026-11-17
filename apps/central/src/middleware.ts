import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith('/panel/login') || req.nextUrl.pathname.startsWith('/b2b/logowanie') || req.nextUrl.pathname.startsWith('/b2b/rejestracja');
  
  if (!isLoggedIn && !isAuthPage) {
    if (req.nextUrl.pathname.startsWith('/panel')) return NextResponse.redirect(new URL('/panel/login', req.nextUrl));
    if (req.nextUrl.pathname.startsWith('/b2b')) return NextResponse.redirect(new URL('/b2b/logowanie', req.nextUrl));
  }

  if (isLoggedIn && isAuthPage) {
    if (req.auth?.user?.role === 'admin' && req.nextUrl.pathname.startsWith('/panel')) return NextResponse.redirect(new URL('/panel', req.nextUrl));
    if (req.auth?.user?.role === 'company' && req.nextUrl.pathname.startsWith('/b2b')) return NextResponse.redirect(new URL('/b2b', req.nextUrl));
  }

  // Zabezpieczenie przed krzyżowym dostępem
  if (isLoggedIn) {
    const role = req.auth?.user?.role;
    if (role === 'admin' && req.nextUrl.pathname.startsWith('/b2b')) return NextResponse.redirect(new URL('/panel', req.nextUrl));
    if (role === 'company' && req.nextUrl.pathname.startsWith('/panel')) return NextResponse.redirect(new URL('/b2b', req.nextUrl));
  }

  return NextResponse.next();
})

export const config = {
  matcher: ["/panel/:path*", "/b2b/:path*"],
}
