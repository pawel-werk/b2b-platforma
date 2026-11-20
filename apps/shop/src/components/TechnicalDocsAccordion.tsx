import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";
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
  const [isOpen, setIsOpen] = useState(false);

  if (!files || files.length === 0) return null;

  const groups = files.reduce<Record<string, DocFile[]>>((acc, file) => {
    const key = file.kind || "inny";
    acc[key] = acc[key] || [];
    acc[key].push(file);
    return acc;
  }, {});

  const groupKeys = Object.keys(groups);

  const getBadgeLabel = (f: DocFile) => {
    if (f.mimeType.includes("pdf") || f.url.endsWith(".pdf")) return "PDF";
    if (f.url.endsWith(".dwg") || f.url.endsWith(".obj")) return "3D";
    return "PLIK";
  };

  return (
    <div className="border-b border-shop-line">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="w-full py-5 flex items-center justify-between gap-4 text-left text-sm font-normal text-shop-ink hover:text-shop-bronze transition-colors"
      >
        <span className="text-[12px] uppercase tracking-[0.16em]">
          Dokumentacja techniczna
        </span>
        {isOpen ? (
          <Minus className="w-4 h-4 text-shop-muted shrink-0" strokeWidth={1.25} />
        ) : (
          <Plus className="w-4 h-4 text-shop-muted shrink-0" strokeWidth={1.25} />
        )}
      </button>

      {isOpen && (
        <div className="pb-6 space-y-5">
          {groupKeys.map((key) => {
            const label = KIND_LABELS[key] || key;
            const items = groups[key];

            return (
              <div key={key} className="space-y-2.5">
                <p className="label">{label}</p>
                <div className="divide-y divide-shop-line border-t border-shop-line">
                  {items.map((f, idx) => (
                    <div
                      key={`${f.title}-${idx}`}
                      className="flex items-center justify-between gap-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="label text-shop-ink border border-shop-line px-2 py-0.5 rounded-[2px] shrink-0">
                          {getBadgeLabel(f)}
                        </span>
                        <span className="text-sm font-light text-shop-ink truncate">
                          {f.title}
                        </span>
                      </div>
                      <a
                        href={resolveAssetUrl(f.url)}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-normal text-shop-ink underline underline-offset-4 decoration-shop-line hover:decoration-shop-ink shrink-0 transition-colors"
                      >
                        Pobierz
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}