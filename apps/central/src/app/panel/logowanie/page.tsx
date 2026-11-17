import { signIn } from "@/auth";
import { Logo } from "@/components/Logo";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-surface p-6">
      <div className="bg-brand-bg p-10 rounded-card shadow-sm border border-brand-border max-w-md w-full flex flex-col items-center">
        <Logo className="mb-8" />
        <div className="w-full text-center mb-8">
          <h1 className="text-2xl font-bold">Panel Administratora</h1>
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
              redirectTo: "/panel/klienci-oczekujacy" 
            });
          } catch (error) {
            if (error instanceof AuthError) {
              redirect("/panel/logowanie?error=1");
            }
            throw error; // Konieczne, by zadziałało przekierowanie Next.js po udanym logowaniu!
          }
        }} className="flex flex-col gap-5 w-full">
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-brand-ink ml-2">Adres e-mail</label>
            <input type="email" name="email" required defaultValue="admin@italgroup.pl" className="border border-brand-border bg-brand-surface p-3.5 rounded-pill text-brand-ink focus:bg-brand-bg transition" />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-brand-ink ml-2">Hasło</label>
            <input type="password" name="password" required defaultValue="12345678" className="border border-brand-border bg-brand-surface p-3.5 rounded-pill text-brand-ink focus:bg-brand-bg transition" />
          </div>

          <button type="submit" className="bg-brand-primary text-white font-bold p-4 rounded-pill hover:bg-[#3E634C] transition mt-4 w-full">
            Zaloguj się
          </button>
        </form>
      </div>
    </div>
  );
}
