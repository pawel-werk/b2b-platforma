import { db } from "@/db";
import { updateCustomerDiscount } from "./actions";

export default async function CustomersPage() {
  // Pobieramy wszystkich klientów hurtowych (od najnowszych)
  const customers = await db.query.b2bCustomers.findMany({
    orderBy: (c, { desc }) => [desc(c.createdAt)],
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Klienci Hurtowi (B2B)</h1>
      
      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left text-slate-900">
          <thead className="bg-slate-50 border-b text-slate-600">
            <tr>
              <th className="p-4">Firma</th>
              <th className="p-4">NIP</th>
              <th className="p-4">E-mail</th>
              <th className="p-4 text-right">Rabat stały (%)</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50 transition">
                <td className="p-4 font-medium">{c.companyName}</td>
                <td className="p-4 font-mono text-slate-500">{c.nip}</td>
                <td className="p-4">{c.email}</td>
                <td className="p-4 text-right">
                  {/* Formularz wpięty bezpośrednio w komórkę tabeli */}
                  <form action={async (formData) => {
                    "use server";
                    await updateCustomerDiscount(c.id, formData);
                  }} className="flex items-center justify-end gap-2">
                    <input
                      type="number"
                      name="discount"
                      step="0.01"
                      min="0"
                      max="100"
                      // Przeliczamy punkty bazowe z powrotem na ułamek do wyświetlenia (np. 1250 pb -> 12.50)
                      defaultValue={(c.discountPb / 100).toFixed(2)}
                      className="border p-1 w-20 text-right rounded bg-white text-slate-900"
                    />
                    <span className="text-slate-500 font-bold">%</span>
                    <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition">
                      Zapisz
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500">Brak zarejestrowanych klientów B2B.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}