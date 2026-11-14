import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
<nav className="text-sm font-normal flex gap-4">
              <a href="/panel" className="hover:underline">Pulpit</a>
              <a href="/panel/produkty" className="hover:underline">Produkty</a>
              <a href="/panel/zamowienia" className="hover:underline text-blue-300">Zamówienia</a>
              <a href="/panel/marki" className="hover:underline text-purple-300">Marki</a>
              <a href="/panel/klienci" className="hover:underline text-emerald-300">Klienci B2B</a>
            </nav>