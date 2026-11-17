import "./globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
});

export const metadata = {
  title: "ITAL GROUP - B2B",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={jakarta.variable}>
      <body>
        {children}
        <Toaster richColors toastOptions={{ style: { borderRadius: '16px' } }} />
      </body>
    </html>
  );
}
