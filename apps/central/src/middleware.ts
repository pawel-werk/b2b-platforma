import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({ req, secret: process.env.AUTH_SECRET || "dev-secret-fallback", salt: "authjs.session-token" });
  const isLoggedIn = !!token;

  const role = token?.role as string | undefined;
  const isCompany = role === "company";

  if (pathname.startsWith("/api/public") || pathname.startsWith("/api/cron") || pathname.startsWith("/api/files")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/panel")) {
    const isLogin = pathname === "/panel/logowanie";
    if (!isLoggedIn) {
      if (!isLogin) return NextResponse.redirect(new URL("/panel/logowanie", req.url));
      return NextResponse.next();
    }
    if (isCompany) {
      return NextResponse.redirect(new URL("/b2b/katalog", req.url));
    }
    if (isLogin) {
      return NextResponse.redirect(new URL("/panel", req.url));
    }
  }

  if (pathname.startsWith("/b2b")) {
    const isB2bAuth = pathname === "/b2b/logowanie" || pathname === "/b2b/rejestracja";
    if (!isLoggedIn) {
      if (!isB2bAuth) return NextResponse.redirect(new URL("/b2b/logowanie", req.url));
      return NextResponse.next();
    }
    if (!isCompany) {
      return NextResponse.redirect(new URL("/panel", req.url));
    }
    if (isB2bAuth) {
      return NextResponse.redirect(new URL("/b2b/katalog", req.url));
    }
  }

  return NextResponse.next();
}

export const config = { matcher: ["/panel/:path*", "/b2b/:path*"] };
