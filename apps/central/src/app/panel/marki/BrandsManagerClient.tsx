"use client";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Plus, Save } from "lucide-react";
import type { DeliverySettings } from "@repo/shared";
import {
  saveBrandDeliverySettings,
  saveBrandBanner,
  reorderBrandBanner,
  toggleBrandBannerActive,
} from "@/actions/brands-admin";

interface BrandItem {
  id: string;
  slug: string;
  name: string;
  contentVersion: number;
  deliverySettings: DeliverySettings;
  banners: Array<{
    id: string;
    imageUrl: string;
    title: string;
    subtitle: string;
    buttonText: string;
    targetUrl: string;
    sortOrder: number;
    isActive: boolean;
  }>;
}

export function BrandsManagerClient({ initialBrands }: { initialBrands: BrandItem[] }) {
  const [selectedBrandId, setSelectedBrandId] = useState(initialBrands[0]?.id || "");
  const currentBrand = initialBrands.find((b) => b.id === selectedBrandId) || initialBrands[0];

  const [delivery, setDelivery] = useState<DeliverySettings>(
    currentBrand?.deliverySettings || {
      freeShippingThresholdGrossGrosze: 150000,
      methods: [],
    }
  );

  const [newBanner, setNewBanner] = useState({
    title: "",
    subtitle: "",
    imageUrl: "/banners/default.svg",
    buttonText: "Zobacz kolekcję",
    targetUrl: "/katalog",
  });

  if (!currentBrand) {
    return <div className="p-8 bg-white rounded-card border border-brand-border">Brak zdefiniowanych marek.</div>;
  }

  const handleSelectBrand = (brandId: string) => {
    setSelectedBrandId(brandId);
    const found = initialBrands.find((b) => b.id === brandId);
    if (found) setDelivery(found.deliverySettings);
  };

  const handleSaveDelivery = async () => {
    try {
      await saveBrandDeliverySettings(currentBrand.id, delivery);
      toast.success(`Zapisano ustawienia dostawy dla ${currentBrand.name} (contentVersion +1)`);
    } catch {
      toast.error("Błąd zapisu ustawień dostawy.");
    }
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanner.title.trim()) return toast.error("Podaj tytuł banera");
    try {
      await saveBrandBanner({
        brandId: currentBrand.id,
        imageUrl: newBanner.imageUrl,
        title: newBanner.title,
        subtitle: newBanner.subtitle,
        buttonText: newBanner.buttonText,
        targetUrl: newBanner.targetUrl,
        sortOrder: currentBrand.banners.length + 1,
        isActive: true,
      });
      setNewBanner({
        title: "",
        subtitle: "",
        imageUrl: "/banners/default.svg",
        buttonText: "Zobacz kolekcję",
        targetUrl: "/katalog",
      });
      toast.success("Dodano nowy baner (contentVersion +1)");
    } catch {
      toast.error("Nie udało się zapisać banera.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        {initialBrands.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => handleSelectBrand(b.id)}
            className={`px-5 py-2.5 rounded-pill font-semibold text-sm transition ${
              b.id === currentBrand.id
                ? "bg-brand-primary text-white shadow-sm"
                : "bg-white border border-brand-border text-brand-ink hover:bg-brand-soft"
            }`}
          >
            {b.name} <span className="text-xs opacity-75 ml-1">(v{b.contentVersion})</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* EDYTOR USTAWIEŃ DOSTAWY */}
        <div className="bg-white p-6 rounded-card border border-brand-border space-y-6">
          <div>
            <h2 className="text-lg font-bold text-brand-ink">Ustawienia dostawy – {currentBrand.name}</h2>
            <p className="text-xs text-brand-muted">Kwoty brutto (w złotówkach, zapisywane w bazie w groszach)</p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Próg darmowej dostawy brutto (PLN)</label>
            <input
              type="number"
              step="0.01"
              value={(delivery.freeShippingThresholdGrossGrosze / 100).toFixed(2)}
              onChange={(e) =>
                setDelivery({
                  ...delivery,
                  freeShippingThresholdGrossGrosze: Math.round(parseFloat(e.target.value || "0") * 100),
                })
              }
              className="w-full border border-brand-border p-3 rounded-lg outline-none focus:border-brand-primary"
            />
          </div>

          <div className="space-y-3">
            {delivery.methods.map((m, idx) => (
              <div key={m.method} className="flex items-center justify-between gap-4 p-3 rounded-xl border border-brand-border bg-brand-surface">
                <label className="flex items-center gap-3 font-semibold text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={m.enabled}
                    onChange={(e) => {
                      const next = [...delivery.methods];
                      next[idx] = { ...m, enabled: e.target.checked };
                      setDelivery({ ...delivery, methods: next });
                    }}
                    className="w-4 h-4 accent-brand-primary"
                  />
                  {m.label}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={(m.priceGrossGrosze / 100).toFixed(2)}
                    onChange={(e) => {
                      const next = [...delivery.methods];
                      next[idx] = { ...m, priceGrossGrosze: Math.round(parseFloat(e.target.value || "0") * 100) };
                      setDelivery({ ...delivery, methods: next });
                    }}
                    className="w-28 border border-brand-border p-2 rounded-lg text-right font-semibold text-sm bg-white"
                  />
                  <span className="text-xs font-semibold text-brand-muted">zł brutto</span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSaveDelivery}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-pill bg-brand-primary text-white font-semibold text-sm hover:opacity-90 transition"
          >
            <Save size={16} /> Zapisz ustawienia dostawy
          </button>
        </div>

        {/* EDYTOR BANERÓW */}
        <div className="bg-white p-6 rounded-card border border-brand-border space-y-6">
          <div>
            <h2 className="text-lg font-bold text-brand-ink">Banery promocyjne – {currentBrand.name}</h2>
            <p className="text-xs text-brand-muted">Zmiana kolejności, włączanie i dodawanie nowych slajdów</p>
          </div>

          <div className="space-y-3">
            {currentBrand.banners.map((b, i) => (
              <div key={b.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-brand-border bg-brand-surface">
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => reorderBrandBanner(b.id, currentBrand.id, "up")}
                    className="p-1 text-brand-muted hover:text-brand-ink disabled:opacity-30"
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    disabled={i === currentBrand.banners.length - 1}
                    onClick={() => reorderBrandBanner(b.id, currentBrand.id, "down")}
                    className="p-1 text-brand-muted hover:text-brand-ink disabled:opacity-30"
                  >
                    <ArrowDown size={15} />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-brand-ink truncate">{b.title}</p>
                  <p className="text-xs text-brand-muted truncate">{b.subtitle}</p>
                  <p className="text-[11px] font-mono text-brand-primary mt-0.5">{b.targetUrl}</p>
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={b.isActive}
                    onChange={(e) => toggleBrandBannerActive(b.id, currentBrand.id, e.target.checked)}
                    className="w-4 h-4 accent-brand-primary"
                  />
                  Aktywny
                </label>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddBanner} className="pt-4 border-t border-brand-border space-y-3">
            <h3 className="text-sm font-bold text-brand-ink">Dodaj nowy baner</h3>
            <input
              required
              placeholder="Tytuł banera"
              value={newBanner.title}
              onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
              className="w-full border border-brand-border p-2.5 rounded-lg text-sm"
            />
            <input
              placeholder="Podtytuł"
              value={newBanner.subtitle}
              onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })}
              className="w-full border border-brand-border p-2.5 rounded-lg text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Adres obrazu (/banners/...)"
                value={newBanner.imageUrl}
                onChange={(e) => setNewBanner({ ...newBanner, imageUrl: e.target.value })}
                className="w-full border border-brand-border p-2.5 rounded-lg text-sm"
              />
              <input
                placeholder="Docelowy URL lub kolekcja"
                value={newBanner.targetUrl}
                onChange={(e) => setNewBanner({ ...newBanner, targetUrl: e.target.value })}
                className="w-full border border-brand-border p-2.5 rounded-lg text-sm"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill bg-brand-primary text-white font-semibold text-sm"
            >
              <Plus size={16} /> Dodaj baner
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
