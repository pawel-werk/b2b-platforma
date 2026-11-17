import React from "react";
import { Link } from "react-router-dom";
import { X, ShoppingBag } from "lucide-react";
import { useToastStore } from "../store/toastStore";

export function ToastContainer() {
  const { toasts, dismissToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto bg-shop-navy text-white p-4 rounded-card shadow-xl border border-white/10 flex items-start gap-3"
        >
          <ShoppingBag className="w-5 h-5 text-white shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-bold">{t.title}</p>
            {t.description && <p className="text-white/80 text-xs mt-0.5">{t.description}</p>}
            {t.showCartLink && (
              <Link
                to="/koszyk"
                onClick={() => dismissToast(t.id)}
                className="inline-block mt-2 px-3 py-1 rounded-pill bg-white text-shop-navy font-semibold text-xs hover:bg-shop-surface transition"
              >
                Przejdź do koszyka →
              </Link>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            aria-label="Zamknij powiadomienie"
            className="text-white/70 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
