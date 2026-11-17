"use client";
import { useState } from "react";
import { registerB2BCompany } from "@/actions/b2b-auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      await registerB2BCompany(formData);
      toast.success("Wniosek został wysłany! Oczekuj na zatwierdzenie.");
      router.push("/b2b/logowanie");
    } catch (err: any) {
      toast.error(err.message || "Wystąpił błąd podczas rejestracji.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg p-6 py-12">
      <div className="w-full max-w-2xl bg-white p-8 rounded-card border border-brand-border shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand-ink mb-2">Wniosek o współpracę B2B</h1>
          <p className="text-brand-muted text-sm">Wypełnij dane rejestrowe firmy. Po weryfikacji otrzymasz pełny dostęp do katalogu i rabatów.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-semibold mb-2">Pełna nazwa firmy</label>
              <input required name="name" className="w-full border border-brand-border p-3 rounded-lg outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">NIP</label>
              <input required name="nip" className="w-full border border-brand-border p-3 rounded-lg outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Ulica i numer</label>
              <input required name="street" className="w-full border border-brand-border p-3 rounded-lg outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Kod pocztowy</label>
              <input required name="zipCode" className="w-full border border-brand-border p-3 rounded-lg outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Miejscowość</label>
              <input required name="city" className="w-full border border-brand-border p-3 rounded-lg outline-none focus:border-brand-primary" />
            </div>
          </div>

          <div className="border-t border-brand-border pt-6 grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-semibold mb-2">Osoba kontaktowa (Imię i nazwisko)</label>
              <input required name="contactPerson" className="w-full border border-brand-border p-3 rounded-lg outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">E-mail (Twój Login)</label>
              <input required type="email" name="email" className="w-full border border-brand-border p-3 rounded-lg outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Telefon</label>
              <input required name="phone" className="w-full border border-brand-border p-3 rounded-lg outline-none focus:border-brand-primary" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold mb-2">Hasło logowania</label>
              <input required type="password" name="password" minLength={8} className="w-full border border-brand-border p-3 rounded-lg outline-none focus:border-brand-primary" />
            </div>
          </div>
          
          <button disabled={loading} type="submit" className="w-full bg-brand-primary text-white font-bold py-4 rounded-pill hover:bg-opacity-90 transition mt-4">
            {loading ? "Wysyłanie..." : "Wyślij wniosek rejestracyjny"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-brand-border text-center">
          <p className="text-sm text-brand-muted mb-2">Masz już konto?</p>
          <Link href="/b2b/logowanie" className="text-brand-ink font-bold hover:underline">Wróć do logowania</Link>
        </div>
      </div>
    </div>
  );
}
