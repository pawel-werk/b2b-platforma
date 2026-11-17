"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await signIn("credentials", {
      email, password, redirect: false
    });

    if (result?.error) {
      toast.error("Nieprawidłowy e-mail lub hasło.");
      setLoading(false);
    } else {
      router.push("/b2b");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-card border border-brand-border shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand-ink mb-2">Panel B2B Italgroup</h1>
          <p className="text-brand-muted text-sm">Zaloguj się na konto swojej firmy</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">E-mail</label>
            <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border border-brand-border p-3 rounded-lg outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Hasło</label>
            <input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border border-brand-border p-3 rounded-lg outline-none focus:border-brand-primary" />
          </div>
          
          <button disabled={loading} type="submit" className="w-full bg-brand-ink text-white font-bold py-3 rounded-pill hover:bg-opacity-90 transition mt-4">
            {loading ? "Logowanie..." : "Zaloguj się"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-brand-border text-center">
          <p className="text-sm text-brand-muted mb-2">Nie masz jeszcze konta B2B?</p>
          <Link href="/b2b/rejestracja" className="text-brand-primary font-bold hover:underline">Złóż wniosek o współpracę</Link>
        </div>
      </div>
    </div>
  );
}
