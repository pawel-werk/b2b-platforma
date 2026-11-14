import { loginB2B } from "./actions";

export default function B2bLoginPage() {
  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-slate-900">
      <h1 className="text-2xl font-bold mb-2">Strefa Hurtowa B2B</h1>
      <p className="text-slate-500 mb-6 text-sm">Zaloguj się podając NIP i adres e-mail przypisany do konta firmowego.</p>

      <form action={loginB2B} className="flex flex-col gap-4">
        <label className="flex flex-col text-sm font-medium">Adres e-mail
          <input type="email" name="email" required placeholder="biuro@firma.pl" className="border p-2 mt-1 rounded bg-slate-50" />
        </label>
        <label className="flex flex-col text-sm font-medium">Numer NIP
          <input type="text" name="nip" required placeholder="1234567890" className="border p-2 mt-1 rounded bg-slate-50" />
        </label>
        <button type="submit" className="bg-slate-900 text-white hover:bg-slate-800 py-3 rounded mt-2 font-bold transition">
          Wejdź do hurtowni
        </button>
      </form>
    </div>
  );
}