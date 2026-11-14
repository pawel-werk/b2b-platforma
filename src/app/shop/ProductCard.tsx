"use client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/store";
import { toast } from "sonner";

export default function ProductCard({ product, b2bCustomer }: { product: any, b2bCustomer: any }) {
  const addItem = useCart((state) => state.addItem);

  // LOGIKA BIZNESOWA CEN (Zawsze na groszach)
  let baseNet = product.retailPriceNet;
  let priceLabel = "Detal";

  // Jeśli hurtownik i wprowadzono cenę hurtową - używamy jej jako bazy
  if (b2bCustomer && product.wholesalePriceNet !== null) {
    baseNet = product.wholesalePriceNet;
    priceLabel = "Hurt";
  }

  // Aplikowanie rabatu z punktów bazowych dla zalogowanego B2B (np. 1000 pb = 10% rabatu)
  let finalNet = baseNet;
  if (b2bCustomer && b2bCustomer.discountPb > 0) {
    const discountMultiplier = (10000 - b2bCustomer.discountPb) / 10000;
    finalNet = Math.round(baseNet * discountMultiplier);
  }

  // Wyliczenie kwoty VAT i całkowitej ceny brutto z ostatecznej ceny Netto
  const vatAmount = Math.round(finalNet * (product.vatRate / 100));
  const totalGross = finalNet + vatAmount;

  const priceGrossPLN = (totalGross / 100).toFixed(2);
  const finalNetPLN = (finalNet / 100).toFixed(2);

  const isAvailable = product.availability === "in_stock";

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      priceGross: totalGross, // Do bazy leci ostateczna wyliczona kwota brutto (już z rabatem B2B)
      quantity: 1
    });
    toast.success("Dodano do koszyka!", {
      description: `${product.name} został pomyślnie dodany.`
    });
  };

  return (
    <Card className="overflow-hidden flex flex-col justify-between hover:shadow-md transition bg-white text-slate-900 border-slate-200">
      <div className="aspect-square bg-slate-50 relative border-b">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">Brak zdjęcia</div>
        )}
        {!isAvailable && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm">
            Brak na stanie
          </div>
        )}
        {b2bCustomer && b2bCustomer.discountPb > 0 && (
           <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
             -{b2bCustomer.discountPb / 100}% Twój Rabat
           </div>
        )}
      </div>
      
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="text-xs text-slate-400 mb-1 font-mono">{product.symbol}</div>
        <h3 className="font-bold text-lg leading-tight mb-2">{product.name}</h3>
        <p className="text-sm text-slate-500 line-clamp-2 mt-auto">{product.description}</p>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="flex flex-col">
          {b2bCustomer ? (
            <>
              <span className="font-bold text-xl text-blue-700">{finalNetPLN} zł</span>
              <span className="text-[10px] text-slate-500 uppercase">Netto ({priceLabel}) + {product.vatRate}% VAT</span>
            </>
          ) : (
            <>
              <span className="font-bold text-xl">{priceGrossPLN} zł</span>
              <span className="text-[10px] text-slate-500 uppercase">Brutto z VAT</span>
            </>
          )}
        </div>
        <Button disabled={!isAvailable} onClick={handleAddToCart} className="bg-slate-900 text-white hover:bg-slate-800">
          Do koszyka
        </Button>
      </CardFooter>
    </Card>
  );
}