"use client";
import { useState, useTransition } from "react";
import { toggleProductAvailability } from "@/actions/catalog";
import { toast } from "sonner";

export function ProductToggle({ id, productName, initialStock, initialAvailability }: { id: string, productName: string, initialStock?: number, initialAvailability?: string }) {
  // Zapewniamy kompatybilność wsteczną, jeśli tabela nadal przekazuje "initialStock"
  const startingState = initialAvailability || (initialStock !== undefined && initialStock > 0 ? "available" : "unavailable");
  
  const [availability, setAvailability] = useState(startingState);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    const oldValue = availability;
    
    setAvailability(newValue); // Optymistyczna, natychmiastowa zmiana w UI
    
    startTransition(async () => {
      try {
        // Wysyłamy nowy status tekstowy do serwera (wymaga, by akcja akceptowała string)
        await toggleProductAvailability(id, newValue);
        toast.success(`Zmieniono dostępność: ${productName}`, {
          action: {
            label: "Cofnij",
            onClick: async () => {
              setAvailability(oldValue);
              await toggleProductAvailability(id, oldValue);
              toast("Cofnięto zmianę dostępności.");
            }
          }
        });
      } catch (err) {
        setAvailability(oldValue); // Wycofanie przy błędzie bazy danych
        toast.error("Błąd zapisu w bazie danych. Spróbuj ponownie.");
      }
    });
  };

  return (
    <select 
      value={availability}
      onChange={handleChange}
      disabled={isPending}
      className={`text-xs font-semibold py-1.5 px-2 border rounded-md outline-none transition-colors cursor-pointer focus:ring-2 focus:ring-brand-primary ${
        availability === 'available' ? 'bg-[#E6EFE8] text-[#4F7A5E] border-[#4F7A5E]/20' :
        availability === 'on_demand' ? 'bg-orange-50 text-orange-700 border-orange-200' :
        'bg-red-50 text-red-700 border-red-200'
      } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <option value="available">Dostępny w magazynie</option>
      <option value="on_demand">Na zamówienie</option>
      <option value="unavailable">Niedostępny</option>
    </select>
  );
}
