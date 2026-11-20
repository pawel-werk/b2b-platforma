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
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-[calc(100vw-3rem)] pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto bg-shop-ink text-shop-bg p-4 rounded-[2px] border border-shop-line flex items-start gap-3.5"
        >
          <ShoppingBag className="w-4 h-4 text-shop-bg shrink-0 mt-0.5" strokeWidth={1.25} />
          <div className="flex-1 text-sm">
            <p className="font-medium tracking-[0.01em]">{t.title}</p>
            {t.description && (
              <p className="text-shop-bg/75 text-xs font-light mt-1 leading-relaxed">
                {t.description}
              </p>
            )}
            {t.showCartLink && (
              <Link
                to="/koszyk"
                onClick={() => dismissToast(t.id)}
                className="inline-block mt-3 text-[11px] uppercase tracking-[0.14em] text-shop-bg underline underline-offset-4 decoration-shop-bg/50 hover:decoration-shop-bg transition-colors"
              >
                Przejdź do koszyka
              </Link>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            aria-label="Zamknij powiadomienie"
            className="text-shop-bg/65 hover:text-shop-bg p-1 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.25} />
          </button>
        </div>
      ))}
    </div>
  );
}