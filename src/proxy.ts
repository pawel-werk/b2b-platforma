import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLogged = !!req.auth;
  const isPanelRoute = req.nextUrl.pathname.startsWith("/panel");

  // Jeśli ktoś próbuje wejść do panelu administracyjnego bez zalogowania
  if (isPanelRoute && !isLogged) {
    // Bezwzględne przekierowanie na publiczną stronę sklepu
    return NextResponse.redirect(new URL("/shop", req.nextUrl));
  }

  // Wpuszczamy dalej
  return NextResponse.next();
});

// Middleware uruchamia się dla wszystkich adresów OPRÓCZ plików statycznych, obrazków i API
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads).*)"],
};