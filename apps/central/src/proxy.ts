import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLogged = !!req.auth;
  const role = req.auth?.user?.role;
  const path = req.nextUrl.pathname;

  if (path.startsWith("/panel")) {
    if (path === "/panel/logowanie") return NextResponse.next();
    if (!isLogged || role !== "staff") {
      return NextResponse.redirect(new URL("/panel/logowanie", req.nextUrl));
    }
  }

  if (path.startsWith("/b2b")) {
    if (path === "/b2b/logowanie" || path === "/b2b/rejestracja") return NextResponse.next();
    if (!isLogged || role !== "company") {
      return NextResponse.redirect(new URL("/b2b/logowanie", req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};