import { signIn } from "@/auth";
import { Logo } from "@/components/Logo";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default function B2bLoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-surface p-6">
      <div className="bg-brand-bg p-10 rounded-card shadow-sm border border-brand-border max-w-md w-full flex flex-col items-center">
        <Logo className="mb-8" />
        <div className="w-full text-center mb-8">
          <h1 className="text-2xl font-bold">Platforma B2B</h1>
        </div>
        
        {searchParams?.error && (
          <div className="w-full p-3 mb-5 bg-red-50 text-red-600 text-sm rounded-lg text-center font-bold">
            Błędny e-mail lub hasło.
          </div>
        )}

        <form action={async (formData) => {
          "use server";
          try {
            await signIn("credentials", { 
              email: formData.get("email"), 
              password: formData.get("password"),
              redirectTo: "/b2b/katalog" 
            });
          } catch (error) {
            if (error instanceof AuthError) {
              redirect("/b2b/logowanie?error=1");
            }
            throw error;
          }
        }} className="flex flex-col gap-5 w-full">
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-brand-ink ml-2">Adres e-mail</label>
            <input type="email" name="email" required className="border border-brand-border bg-brand-surface p-3.5 rounded-pill text-brand-ink focus:bg-brand-bg transition" />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-brand-ink ml-2">Hasło</label>
            <input type="password" name="password" required className="border border-brand-border bg-brand-surface p-3.5 rounded-pill text-brand-ink focus:bg-brand-bg transition" />
          </div>

          <button type="submit" className="bg-brand-primary text-white font-bold p-4 rounded-pill hover:bg-[#3E634C] transition mt-4 w-full">
            Zaloguj się
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          Nie jesteś naszym klientem?{" "}
          <Link href="/b2b/rejestracja" className="font-semibold text-blue-600 hover:text-blue-500 hover:underline">
            Zarejestruj się
          </Link>
        </div>
      </div>
    </div>
  );
}