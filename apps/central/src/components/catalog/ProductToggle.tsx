"use client";
import { useState, useTransition } from "react";
import { toggleProductAvailability } from "@/actions/catalog";
import { toast } from "sonner";

export function ProductToggle({ id, productName, initialStock }: { id: string, productName: string, initialStock: number }) {
  const [isAvailable, setIsAvailable] = useState(initialStock > 0);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const newValue = !isAvailable;
    setIsAvailable(newValue); // Optymistyczna zmiana w UI
    
    startTransition(async () => {
      try {
        await toggleProductAvailability(id, newValue);
        toast.success(`Zapisano dostępność: ${productName}`, {
          action: {
            label: "Cofnij",
            onClick: async () => {
              setIsAvailable(!newValue);
              await toggleProductAvailability(id, !newValue);
              toast("Cofnięto zmianę dostępności.");
            }
          }
        });
      } catch (e) {
        setIsAvailable(!newValue); // Wycofanie przy błędzie bazy
        toast.error("Błąd zapisu w bazie danych.");
      }
    });
  };

  return (
    <button 
      onClick={handleToggle}
      disabled={isPending}
      className={`w-12 h-6 rounded-full relative transition-colors ${isAvailable ? 'bg-brand-primary' : 'bg-brand-border'} ${isPending ? 'opacity-50' : ''}`}
    >
      <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isAvailable ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  );
}
