import React, { useEffect } from "react";
import { X, ArrowLeft, ArrowRight } from "lucide-react";
import { resolveAssetUrl } from "../lib/api";

interface ImageItem {
  url: string;
  alt: string;
}

interface Props {
  images: ImageItem[];
  activeIndex: number;
  onClose: () => void;
  onSelect: (index: number) => void;
}

export function LightboxModal({ images, activeIndex, onClose, onSelect }: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onSelect((activeIndex + 1) % images.length);
      if (e.key === "ArrowLeft") onSelect((activeIndex - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeIndex, images.length, onClose, onSelect]);

  const current = images[activeIndex];
  if (!current) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Powiększenie zdjęcia produktu"
      className="fixed inset-0 z-50 bg-shop-bg/[0.96] backdrop-blur-sm flex flex-col"
    >
      {/* Górna belka: numeracja + zamknięcie */}
      <div className="max-w-[1520px] w-full mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
        <span className="label text-shop-ink tabular-nums">
          {activeIndex + 1} / {images.length}
        </span>

        <button
          type="button"
          onClick={onClose}
          aria-label="Zamknij podgląd (Esc)"
          className="p-2 -mr-2 text-shop-ink hover:text-shop-bronze transition-colors"
        >
          <X className="w-5 h-5" strokeWidth={1.25} />
        </button>
      </div>

      {/* Obszar zdjęcia */}
      <div className="flex-1 relative flex items-center justify-center px-6 md:px-20 pb-10">
        {images.length > 1 && (
          <button
            type="button"
            onClick={() => onSelect((activeIndex - 1 + images.length) % images.length)}
            aria-label="Poprzednie zdjęcie"
            className="absolute left-6 md:left-10 w-11 h-11 rounded-[2px] border border-shop-line bg-shop-bg flex items-center justify-center text-shop-ink hover:border-shop-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.25} />
          </button>
        )}

        <div className="max-h-[80vh] max-w-[82vw] flex items-center justify-center">
          <img
            src={resolveAssetUrl(current.url)}
            alt={current.alt}
            width={1000}
            height={1000}
            className="max-h-[80vh] max-w-[82vw] object-contain mix-blend-multiply"
          />
        </div>

        {images.length > 1 && (
          <button
            type="button"
            onClick={() => onSelect((activeIndex + 1) % images.length)}
            aria-label="Następne zdjęcie"
            className="absolute right-6 md:right-10 w-11 h-11 rounded-[2px] border border-shop-line bg-shop-bg flex items-center justify-center text-shop-ink hover:border-shop-ink transition-colors"
          >
            <ArrowRight className="w-4 h-4" strokeWidth={1.25} />
          </button>
        )}
      </div>
    </div>
  );
}