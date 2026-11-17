import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { resolveAssetUrl } from "../lib/api";

interface DocFile {
  kind: string;
  title: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

const KIND_LABELS: Record<string, string> = {
  rysunek_techniczny: "Rysunek techniczny",
  karta_techniczna: "Rysunek techniczny i karta produktu",
  instrukcja: "Instrukcja montażu",
  instrukcja_montazu: "Instrukcja montażu",
  karta_gwarancyjna: "Karta gwarancyjna",
  model_3d: "Modele 3D dla architektów",
  inny: "Dokumentacja dodatkowa",
};

export function TechnicalDocsAccordion({ files }: { files: DocFile[] }) {
  if (!files || files.length === 0) return null;

  const groups = files.reduce<Record<string, DocFile[]>>((acc, file) => {
    const key = file.kind || "inny";
    acc[key] = acc[key] || [];
    acc[key].push(file);
    return acc;
  }, {});

  const groupKeys = Object.keys(groups);
  const [openKey, setOpenKey] = useState<string | null>(groupKeys[0] || null);

  const getBadgeLabel = (f: DocFile) => {
    if (f.mimeType.includes("pdf") || f.url.endsWith(".pdf")) return "PDF";
    if (f.url.endsWith(".dwg") || f.url.endsWith(".obj")) return "3D";
    return "PLIK";
  };

  return (
    <section aria-label="Dokumentacja techniczna" className="py-12 md:py-16 border-t border-shop-border">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-shop-text">
            Dokumentacja techniczna
          </h2>
          <p className="text-sm md:text-base text-shop-muted">
            Karty techniczne, instrukcje montażu i modele 3D dla architektów.
          </p>
        </div>

        <div className="lg:col-span-7 space-y-3">
          {groupKeys.map((key) => {
            const isOpen = openKey === key;
            const label = KIND_LABELS[key] || key;
            const items = groups[key];

            return (
              <div key={key} className="border border-shop-border rounded-card overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setOpenKey(isOpen ? null : key)}
                  aria-expanded={isOpen}
                  className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-sm md:text-base text-shop-text hover:bg-shop-surface/60 transition"
                >
                  <span>{label}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-shop-muted transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-4 pt-1 space-y-2.5 border-t border-shop-border">
                    {items.map((f, idx) => (
                      <div
                        key={`${f.title}-${idx}`}
                        className="flex items-center justify-between gap-4 py-2.5 px-4 rounded-lg border border-shop-border bg-shop-surface/40"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="px-2.5 py-1 rounded bg-shop-accent text-white text-[11px] font-bold uppercase tracking-wider shrink-0">
                            {getBadgeLabel(f)}
                          </span>
                          <span className="font-semibold text-sm text-shop-text truncate">
                            {f.title}
                          </span>
                        </div>
                        <a
                          href={resolveAssetUrl(f.url)}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold underline text-shop-text hover:text-shop-accent shrink-0"
                        >
                          Pobierz
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
