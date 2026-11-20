"use client";
import { useState } from "react";
import { saveProduct, deleteProduct } from "@/actions/catalog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { UploadCloud, X, ArrowUp, ArrowDown, FileText, Trash2 } from "lucide-react";

type ImgType = { url: string; alt: string; isMain: boolean };
type FileType = { url: string; name: string; type: string };

export function ProductForm({ brand, initialData, b2bData }: { brand: any, initialData?: any, b2bData: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const [name, setName] = useState(initialData?.name || "");
  const [sku, setSku] = useState(initialData?.sku || "");
  const [ean, setEan] = useState(initialData?.ean || "");
  const [priceNet, setPriceNet] = useState(initialData ? (initialData.retailPriceNet / 100).toString() : "");
  const [vat, setVat] = useState(initialData?.vatRate?.toString() || "23");
  const [isNetNet, setIsNetNet] = useState(initialData?.isNetNet || false);
  
  // Trzystopniowa dostępność zamiast suwaka
  const [availability, setAvailability] = useState(initialData?.availability || "available");
  
  const [images, setImages] = useState<ImgType[]>(initialData?.images || []);
  const [files, setFiles] = useState<FileType[]>(initialData?.files || []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploadingImages(true);
    const uploaded: ImgType[] = [];
    for (const file of Array.from(e.target.files)) {
      await new Promise(r => setTimeout(r, 600)); 
      const mockUrl = URL.createObjectURL(file);
      uploaded.push({ url: mockUrl, alt: file.name, isMain: false });
    }
    setImages(prev => {
      const combined = [...prev, ...uploaded];
      if (combined.length > 0 && !combined.find(i => i.isMain)) combined[0].isMain = true;
      return combined;
    });
    setUploadingImages(false);
    toast.success("Zdjęcia dodane do galerii!");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploadingFiles(true);
    for (const file of Array.from(e.target.files)) {
      await new Promise(r => setTimeout(r, 600));
      const mockUrl = URL.createObjectURL(file);
      setFiles(prev => [...prev, { url: mockUrl, name: file.name, type: "instrukcja" }]);
    }
    setUploadingFiles(false);
    toast.success("Pliki załączone!");
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    if (direction === 'up' && index > 0) {
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    } else if (direction === 'down' && index < newImages.length - 1) {
      [newImages[index + 1], newImages[index]] = [newImages[index], newImages[index + 1]];
    }
    setImages(newImages);
  };

  const setMainImage = (index: number) => {
    setImages(images.map((img, i) => ({ ...img, isMain: i === index })));
  };

  const isValidEAN13 = (val: string) => {
    if (!/^\d{13}$/.test(val)) return false;
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += parseInt(val[i]) * (i % 2 === 0 ? 1 : 3);
    return (10 - (sum % 10)) % 10 === parseInt(val[12]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prefix = brand.name.substring(0,3).toUpperCase();
    if (!sku.startsWith(prefix)) return toast.error(`Symbol musi zaczynać się od: ${prefix}`);
    if (ean && !isValidEAN13(ean)) return toast.error("Nieprawidłowy kod EAN-13.");

    setLoading(true);
    try {
      await saveProduct({
        id: initialData?.id || "new",
        brandId: brand.id,
        name, sku, ean,
        retailPriceNet: parseFloat(priceNet || "0"),
        vatRate: parseInt(vat || "23"),
        isNetNet,
        availability,
        isAvailable: availability === "available",
        images, files
      });
      toast.success(`Zapisano "${name}".`, {
        action: { label: "Cofnij", onClick: () => toast("Symulacja cofnięcia z cache.") }
      });
      router.push(`/panel/katalog/${brand.id}`);
    } catch (err) {
      toast.error("Wystąpił błąd zapisu.");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    const confirmed = window.confirm(
      `Czy na pewno chcesz trwale usunąć produkt „${initialData.name}”? Tej operacji nie można cofnąć.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await deleteProduct(initialData.id);
      if (res.success) {
        toast.success(`Usunięto produkt „${initialData.name}”.`);
        router.push(`/panel/katalog/${brand.id}`);
        router.refresh();
      } else {
        toast.error("Nie znaleziono produktu do usunięcia.");
        setDeleting(false);
      }
    } catch {
      toast.error("Wystąpił błąd podczas usuwania produktu.");
      setDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-8">
      <div className="col-span-2 space-y-6">
        
        <div className="bg-brand-bg border border-brand-border rounded-card p-6">
          <h2 className="text-xl font-bold mb-6 text-brand-ink">Dane podstawowe</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-semibold mb-2">Nazwa produktu</label>
              <input required value={name} onChange={e=>setName(e.target.value)} className="w-full border border-brand-border p-3 rounded-lg outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Symbol (SKU)</label>
              <input required value={sku} onChange={e=>setSku(e.target.value)} placeholder={`${brand.name.substring(0,3).toUpperCase()}-...`} className="w-full border border-brand-border p-3 rounded-lg outline-none focus:border-brand-primary font-mono" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Kod EAN-13</label>
              <input value={ean} onChange={e=>setEan(e.target.value)} placeholder="Opcjonalny" className="w-full border border-brand-border p-3 rounded-lg outline-none focus:border-brand-primary font-mono" />
            </div>
          </div>
        </div>

        <div className="bg-brand-bg border border-brand-border rounded-card p-6">
          <h2 className="text-xl font-bold mb-2 text-brand-ink">Galeria zdjęć</h2>
          <div className="border-2 border-dashed border-brand-border rounded-card p-6 text-center bg-brand-surface relative hover:bg-brand-soft transition mb-6">
            <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <UploadCloud className="mx-auto h-8 w-8 text-brand-muted mb-2" />
            <p className="font-semibold">{uploadingImages ? "Przetwarzanie..." : "Przeciągnij zdjęcia lub kliknij (Multi-upload)"}</p>
          </div>
          <div className="space-y-4">
            {images.map((img, i) => (
              <div key={i} className={`flex items-center gap-4 p-4 border rounded-card bg-white ${img.isMain ? 'border-brand-primary ring-1 ring-brand-primary' : 'border-brand-border'}`}>
                <div className="flex flex-col gap-1">
                  <button type="button" onClick={() => moveImage(i, 'up')} disabled={i===0} className="p-1 text-brand-muted hover:text-brand-ink disabled:opacity-30"><ArrowUp size={16}/></button>
                  <button type="button" onClick={() => moveImage(i, 'down')} disabled={i===images.length-1} className="p-1 text-brand-muted hover:text-brand-ink disabled:opacity-30"><ArrowDown size={16}/></button>
                </div>
                <img src={img.url} className="w-16 h-16 object-cover rounded-md border border-brand-border" />
                <div className="flex-1">
                  <input value={img.alt} onChange={e => {
                    const next = [...images]; next[i].alt = e.target.value; setImages(next);
                  }} placeholder="Tekst alternatywny (SEO)" className="w-full text-sm border-b border-brand-border outline-none pb-1 focus:border-brand-primary" />
                </div>
                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                  <input type="radio" name="mainImage" checked={img.isMain} onChange={() => setMainImage(i)} className="accent-brand-primary" /> Główna
                </label>
                <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="text-red-500 p-2 hover:bg-red-50 rounded-full"><X size={18}/></button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-brand-bg border border-brand-border rounded-card p-6">
          <h2 className="text-xl font-bold mb-2 text-brand-ink">Pliki do pobrania</h2>
          <div className="border-2 border-dashed border-brand-border rounded-card p-4 text-center bg-brand-surface relative hover:bg-brand-soft transition mb-6">
            <input type="file" multiple accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <p className="font-semibold text-sm">{uploadingFiles ? "Przetwarzanie..." : "Wgraj kartę techniczną, instrukcję (PDF)"}</p>
          </div>
          <div className="space-y-3">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-4 p-3 border border-brand-border rounded-lg bg-white">
                <FileText className="text-brand-muted" size={24} />
                <select value={f.type} onChange={e => {
                  const next = [...files]; next[i].type = e.target.value; setFiles(next);
                }} className="text-sm border border-brand-border rounded p-1 outline-none">
                  <option value="instrukcja">Instrukcja</option>
                  <option value="karta_techniczna">Karta techniczna</option>
                  <option value="inny">Inny</option>
                </select>
                <input value={f.name} onChange={e => {
                  const next = [...files]; next[i].name = e.target.value; setFiles(next);
                }} placeholder="Widoczna nazwa" className="flex-1 text-sm border-b border-brand-border outline-none pb-1" />
                <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-red-500 p-2 hover:bg-red-50 rounded-full"><X size={16}/></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-brand-bg border border-brand-border rounded-card p-6">
          <h2 className="text-lg font-bold mb-4 text-brand-ink">Wycena i status</h2>
          <label className="block text-sm font-semibold mb-2">Cena detaliczna wyjściowa (PLN Netto)</label>
          <input type="number" step="0.01" required value={priceNet} onChange={e=>setPriceNet(e.target.value)} className="w-full border border-brand-border p-3 rounded-lg outline-none mb-4 font-bold text-right focus:border-brand-primary" />
          
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-2">Stawka VAT</label>
              <select value={vat} onChange={e=>setVat(e.target.value)} className="w-full border border-brand-border p-3 rounded-lg outline-none bg-white">
                <option value="23">23%</option>
                <option value="8">8%</option>
                <option value="0">0%</option>
              </select>
            </div>
            <div className="flex-1 flex items-end">
              <label className="flex items-center gap-2 cursor-pointer pb-3">
                <input type="checkbox" checked={isNetNet} onChange={e=>setIsNetNet(e.target.checked)} className="w-5 h-5 rounded accent-brand-primary" />
                <span className="font-bold">Net/Net</span>
              </label>
            </div>
          </div>
          
          {/* NOWY SELEKTOR DOSTĘPNOŚCI */}
          <div className="pt-4 border-t border-brand-border">
            <label className="block text-sm font-semibold mb-2">Dostępność</label>
            <select 
              value={availability} 
              onChange={e=>setAvailability(e.target.value)} 
              className="w-full border border-brand-border p-3 rounded-lg outline-none focus:border-brand-primary bg-white"
            >
              <option value="available">Dostępny w magazynie</option>
              <option value="on_demand">Na zamówienie</option>
              <option value="unavailable">Niedostępny</option>
            </select>
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-card p-6 shadow-inner">
          <h3 className="font-bold text-brand-ink mb-4">Symulacja Ceny dla kontrahentów</h3>
          <div className="flex justify-between items-center pb-4 border-b border-brand-border">
            <p className="font-bold text-sm">Detal netto, bez rabatu</p>
            <div className="text-right">
              <p className="font-bold text-brand-ink">{parseFloat(priceNet || "0").toFixed(2)} PLN</p>
              <p className="text-xs text-brand-muted">Brutto: {(parseFloat(priceNet || "0") * (1 + parseFloat(vat || "23")/100)).toFixed(2)} PLN</p>
            </div>
          </div>
          <div className="mt-4 space-y-4">
            {b2bData.length === 0 ? <p className="text-xs text-brand-muted">Brak aktywnych firm B2B.</p> : null}
            {b2bData.map(company => {
              let finalNet = parseFloat(priceNet || "0");
              let typeLabel = `Rabat ${(company.discountPb / 100).toFixed(2)}%`;
              
              if (company.customPriceNet) {
                finalNet = company.customPriceNet / 100;
                typeLabel = "Cena indywidualna";
              } else if (isNetNet) {
                typeLabel = "Net/Net (Brak rabatu)";
              } else {
                finalNet = finalNet * (1 - (company.discountPb / 10000));
              }
              const finalBrutto = finalNet * (1 + parseFloat(vat || "23")/100);

              return (
                <div key={company.id} className="flex justify-between items-center text-sm bg-white p-3 rounded-lg border border-brand-border">
                  <div>
                    <p className="font-bold text-brand-ink truncate w-32">{company.name}</p>
                    <p className="text-xs font-semibold text-brand-primary">{typeLabel}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-brand-ink">{finalNet.toFixed(2)} PLN</p>
                    <p className="text-[10px] text-brand-muted">{finalBrutto.toFixed(2)} brutto</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <button
          disabled={loading || deleting}
          type="submit"
          className="w-full bg-brand-primary text-white font-bold py-4 rounded-pill hover:bg-opacity-90 transition shadow-md disabled:opacity-50"
        >
          {loading ? "Zapisywanie..." : "Zapisz i publikuj"}
        </button>

        {initialData?.id && (
          <button
            type="button"
            disabled={loading || deleting}
            onClick={handleDelete}
            className="w-full flex items-center justify-center gap-2 border border-red-300 bg-white text-red-600 font-bold py-3.5 rounded-pill hover:bg-red-50 transition disabled:opacity-50"
          >
            <Trash2 size={18} />
            <span>{deleting ? "Usuwanie..." : "Usuń produkt"}</span>
          </button>
        )}
      </div>
    </form>
  );
}