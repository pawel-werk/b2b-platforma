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
      className="fixed inset-0 z-50 bg-shop-navy/90 flex items-center justify-center p-4"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Zamknij podgląd (Esc)"
        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
      >
        <X className="w-6 h-6" />
      </button>

      {images.length > 1 && (
        <button
          type="button"
          onClick={() => onSelect((activeIndex - 1 + images.length) % images.length)}
          aria-label="Poprzednie zdjęcie"
          className="absolute left-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}

      <img
        src={resolveAssetUrl(current.url)}
        alt={current.alt}
        width={1000}
        height={1000}
        className="max-h-[85vh] max-w-[85vw] object-contain bg-white rounded-card p-6"
      />

      {images.length > 1 && (
        <button
          type="button"
          onClick={() => onSelect((activeIndex + 1) % images.length)}
          aria-label="Następne zdjęcie"
          className="absolute right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
