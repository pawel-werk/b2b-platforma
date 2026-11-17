"use client";
import { useState } from "react";
import { completeSimulatedPayment } from "@/actions/brands-admin";

export function PaymentSimulatorClient({
  paymentId,
  orderNumber,
  amountBruttoGrosze,
}: {
  paymentId: string;
  orderNumber: string;
  amountBruttoGrosze: number;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (outcome: "success" | "failed" | "cancelled") => {
    setLoading(outcome);
    try {
      const { redirectUrl } = await completeSimulatedPayment(paymentId, outcome);
      window.location.href = redirectUrl;
    } catch {
      setLoading(null);
      alert("Wystąpił błąd podczas przetwarzania płatności.");
    }
  };

  return (
    <div className="space-y-3 mt-8">
      <button
        type="button"
        disabled={!!loading}
        onClick={() => handleAction("success")}
        className="w-full py-3.5 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition disabled:opacity-50"
      >
        {loading === "success" ? "Przetwarzanie..." : "Zapłać (sukces)"}
      </button>
      <button
        type="button"
        disabled={!!loading}
        onClick={() => handleAction("failed")}
        className="w-full py-3.5 px-6 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition disabled:opacity-50"
      >
        {loading === "failed" ? "Przetwarzanie..." : "Symuluj błąd"}
      </button>
      <button
        type="button"
        disabled={!!loading}
        onClick={() => handleAction("cancelled")}
        className="w-full py-3.5 px-6 rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold text-sm transition disabled:opacity-50"
      >
        {loading === "cancelled" ? "Przetwarzanie..." : "Anuluj"}
      </button>
    </div>
  );
}
