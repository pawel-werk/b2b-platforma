import { db } from "@/db";
import { brands } from "@/db/schema";
import { eq } from "drizzle-orm";
import { saveBrand } from "./actions";

export default async function BrandsPage() {
  const allBrands = await db.query.brands.findMany({ where: eq(brands.isDeleted, false) });

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Zarządzanie Markami (Sklepami)</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg border shadow-sm self-start">
          <h2 className="text-lg font-bold mb-4">Dodaj nową markę</h2>
          <form action={saveBrand} className="flex flex-col gap-4">
            <label className="flex flex-col text-sm font-medium">Nazwa Marki
              <input name="name" required className="border p-2 mt-1 rounded text-slate-900" placeholder="np. Premium Home" />
            </label>
            <label className="flex flex-col text-sm font-medium">Główny Kolor Sklepu (Wybierz)
              <input name="color" type="color" defaultValue="#0f172a" className="w-full h-10 mt-1 cursor-pointer" />
            </label>
            <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mt-2">
              Utwórz markę
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-4">Lista Sklepów</h2>
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-3">Nazwa sklepu</th>
                  <th className="p-3 text-center">Motyw</th>
                </tr>
              </thead>
              <tbody>
                {allBrands.map(b => {
                  let color = "#000";
                  try { color = JSON.parse(b.theme || "{}").color || "#000"; } catch(e){}
                  return (
                    <tr key={b.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="p-3 font-medium">{b.name}</td>
                      <td className="p-3 flex justify-center">
                        <div className="w-6 h-6 rounded-full border shadow-sm" style={{ backgroundColor: color }}></div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}