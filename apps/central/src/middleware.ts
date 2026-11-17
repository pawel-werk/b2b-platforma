import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Pobieramy sesję
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isLoggedIn = !!token;
  
  // Weryfikacja roli (zakładamy, że klienci mają przypisaną rolę "company")
  const role = token?.role as string | undefined;
  const isCompany = role === "company";

  if (pathname.startsWith("/api/public") || pathname.startsWith("/api/cron") || pathname.startsWith("/api/files")) {
    return NextResponse.next();
  }

  // ==========================================
  // OCHRONA PANELU ADMINISTRATORA (/panel)
  // ==========================================
  if (pathname.startsWith("/panel")) {
    const isLogin = pathname === "/panel/logowanie";
    
    // Niezalogowany? Na logowanie.
    if (!isLoggedIn) {
      if (!isLogin) return NextResponse.redirect(new URL("/panel/logowanie", req.url));
      return NextResponse.next();
    }

    // ZALOGOWANY KLIENT B2B W PANELU ADMINA -> BEZWZGLĘDNE WYRZUCENIE DO B2B
    if (isCompany) {
      return NextResponse.redirect(new URL("/b2b/katalog", req.url));
    }

    // Zalogowany Admin na stronie logowania -> przerzucenie na start panelu
    if (isLogin) {
      return NextResponse.redirect(new URL("/panel", req.url));
    }
  }

  // ==========================================
  // OCHRONA PANELU B2B (/b2b)
  // ==========================================
  if (pathname.startsWith("/b2b")) {
    const isB2bAuth = pathname === "/b2b/logowanie" || pathname === "/b2b/rejestracja";
    
    // Niezalogowany? Na logowanie.
    if (!isLoggedIn) {
      if (!isB2bAuth) return NextResponse.redirect(new URL("/b2b/logowanie", req.url));
      return NextResponse.next();
    }

    // ZALOGOWANY ADMIN W STREFIE KLIENTA -> BEZWZGLĘDNE WYRZUCENIE DO ADMINA
    if (!isCompany) {
      return NextResponse.redirect(new URL("/panel", req.url));
    }

    // Zalogowany Klient B2B na stronie logowania -> przerzucenie do katalogu
    if (isB2bAuth) {
      return NextResponse.redirect(new URL("/b2b/katalog", req.url));
    }
  }

  return NextResponse.next();
}

export const config = { matcher: ["/panel/:path*", "/b2b/:path*"] };
