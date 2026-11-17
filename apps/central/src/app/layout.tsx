import type { Metadata } from "next";
import "@fontsource/plus-jakarta-sans";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = { title: "Italgroup B2B", description: "Platforma B2B" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className="scroll-smooth">
      <body className="antialiased font-sans flex flex-col min-h-screen">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:p-4 focus:bg-brand-primary focus:text-white focus:rounded-br-card">
          Przejdź do treści
        </a>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
