import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate, useSearchParams } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { resolveShop, getShopData, getVersion, createOrder } from "./api/client";
import { useCart } from "./store/cart";
import { ShoppingCart } from "lucide-react";

const queryClient = new QueryClient();

function ShopEngine() {
  const [shopInfo, setShopInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    resolveShop().then(res => {
      setShopInfo(res);
      if (res.theme) {
        document.documentElement.style.setProperty('--brand-primary', res.theme.color);
        document.documentElement.style.setProperty('--radius', res.theme.radius);
      }
    }).catch(err => setError(err.message));
  }, []);

  if (error) return <div className="p-12 text-center text-red-600 font-bold">Błąd resolvera: {error}</div>;
  if (!shopInfo) return <div className="p-12 text-center font-bold">Inicjalizacja sklepu...</div>;

  return <ShopRouter slug={shopInfo.slug} brandName={shopInfo.name} />;
}

function ShopRouter({ slug, brandName }: { slug: string, brandName: string }) {
  const { data, isError, error } = useQuery({ queryKey: ["shopData", slug], queryFn: () => getShopData(slug), retry: false });
  
  useQuery({
    queryKey: ["version", slug],
    queryFn: async () => {
      const v = await getVersion(slug);
      return v.version;
    },
    refetchInterval: 20000,
    refetchOnWindowFocus: true
  });

  const cartItems = useCart(s => Object.values(s.items).reduce((a, b) => a + b, 0));

  if (isError) return <div className="p-12 text-center text-red-600 font-bold">Błąd ładowania danych asortymentu: {(error as any).message}</div>;
  if (!data) return <div className="p-12 text-center font-bold">Ładowanie asortymentu...</div>;

  return (
    <BrowserRouter>
      <header className="bg-brand-bg shadow-sm border-b p-6 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-brand-ink">{brandName}</Link>
          <Link to="/koszyk" className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-full font-bold">
            <ShoppingCart size={18} /> {cartItems}
          </Link>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-6">
        <Routes>
          <Route path="/" element={<Catalog products={data.products} />} />
          <Route path="/koszyk" element={<Cart products={data.products} slug={slug} />} />
          <Route path="/wynik" element={<PaymentResult />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

function Catalog({ products }: { products: any[] }) {
  const add = useCart(s => s.add);
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {products.map((p: any) => (
        <div key={p.id} className="border p-6 rounded-card bg-brand-bg hover:shadow-lg transition flex flex-col justify-between">
          <div>
             {p.images?.length > 0 ? <img src={p.images[0].url} className="w-full h-48 object-contain mb-4" /> : <div className="w-full h-48 bg-gray-100 mb-4 rounded flex items-center justify-center text-gray-400 font-semibold text-sm">Brak zdjęcia</div>}
            <h3 className="font-bold text-lg">{p.name}</h3>
            <p className="text-sm text-gray-500 font-mono mb-4">{p.symbol}</p>
          </div>
          <div className="flex justify-between items-end mt-4 pt-4 border-t">
            <div>
              <div className="font-bold text-brand-primary text-xl">{(p.retailPriceGross / 100).toFixed(2)} zł</div>
              <div className="text-xs text-gray-500 font-semibold">{(p.retailPriceNet / 100).toFixed(2)} zł netto</div>
            </div>
            <button onClick={() => add(p.id, 1)} className="bg-brand-ink text-white p-3 rounded-full hover:opacity-90 transition transform hover:scale-105 shadow-sm">
              <ShoppingCart size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function Cart({ products, slug }: { products: any[], slug: string }) {
  const { items, clear } = useCart();
  const [ordering, setOrdering] = useState(false);
  
  const cartEntries = Object.entries(items).map(([id, qty]) => ({ product: products.find(p => p.id === id), qty })).filter(e => e.product);
  const sumGross = cartEntries.reduce((sum, e) => sum + (e.product.retailPriceGross * e.qty), 0);

  const handleCheckout = async (e: any) => {
    e.preventDefault();
    setOrdering(true);
    const formData = new FormData(e.currentTarget);
    const customerData = { name: formData.get("name"), email: formData.get("email"), phone: formData.get("phone") };
    const orderItems = cartEntries.map(e => ({ id: e.product.id, qty: e.qty }));
    
    try {
      const res = await createOrder(slug, customerData, orderItems);
      clear();
      window.location.href = res.paymentUrl;
    } catch (err: any) { 
      alert(err.message || "Błąd płatności"); 
      setOrdering(false); 
    }
  };

  if (cartEntries.length === 0) return <div className="text-center p-12 text-gray-500 font-bold">Koszyk jest pusty.</div>;

  return (
    <div className="grid grid-cols-2 gap-12 mt-4">
      <div>
        <h2 className="text-2xl font-bold mb-6">Koszyk</h2>
        {cartEntries.map(e => (
          <div key={e.product.id} className="flex justify-between items-center border-b py-4">
            <div><p className="font-bold">{e.product.name}</p><p className="text-sm text-gray-500 font-semibold">{e.qty} szt.</p></div>
            <div className="font-bold text-brand-primary">{((e.product.retailPriceGross * e.qty) / 100).toFixed(2)} zł</div>
          </div>
        ))}
        <div className="text-right text-2xl font-bold mt-6 text-brand-ink">Razem: {(sumGross / 100).toFixed(2)} zł</div>
      </div>
      <div className="bg-gray-50 p-8 rounded-card border shadow-sm">
        <h2 className="text-xl font-bold mb-6 text-brand-ink">Dane kupującego (B2C)</h2>
        <form onSubmit={handleCheckout} className="space-y-4">
          <input required name="name" placeholder="Imię i nazwisko" className="w-full p-3 rounded-lg border border-gray-300 outline-none focus:border-brand-primary" />
          <input required name="email" type="email" placeholder="Adres e-mail" className="w-full p-3 rounded-lg border border-gray-300 outline-none focus:border-brand-primary" />
          <input required name="phone" placeholder="Telefon kontaktowy" className="w-full p-3 rounded-lg border border-gray-300 outline-none focus:border-brand-primary" />
          <button disabled={ordering} type="submit" className="w-full bg-brand-primary text-white font-bold py-4 rounded-full hover:opacity-90 transition mt-4 shadow-md">
            {ordering ? "Przekierowanie do płatności..." : "Kupuję i płacę"}
          </button>
        </form>
      </div>
    </div>
  )
}

function PaymentResult() {
  const [params] = useSearchParams();
  const status = params.get("status");
  const order = params.get("order");
  
  return (
    <div className="p-12 text-center border rounded-card bg-gray-50 mt-12 shadow-sm max-w-lg mx-auto">
      <h1 className={`text-3xl font-bold mb-4 ${status === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
        {status === 'paid' ? 'Płatność zakończona sukcesem!' : 'Płatność odrzucona'}
      </h1>
      <p className="text-lg text-gray-700">Twój numer zamówienia: <strong className="font-mono text-brand-ink">{order}</strong></p>
      <Link to="/" className="inline-block mt-8 bg-brand-ink text-white px-8 py-3 rounded-full font-bold hover:opacity-90 transition shadow-md">Wróć do sklepu</Link>
    </div>
  )
}

export default function App() { return <QueryClientProvider client={queryClient}><ShopEngine /></QueryClientProvider>; }
