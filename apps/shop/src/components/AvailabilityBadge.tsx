import React from "react";
import type { AvailabilityStatus } from "@repo/shared";

interface Props {
  status: AvailabilityStatus;
  leadTimeNote?: string | null;
  showNote?: boolean;
}

export function AvailabilityBadge({ status, leadTimeNote, showNote = false }: Props) {
  const config = {
    available: {
      label: "Dostępny",
      bg: "bg-status-availBg",
      text: "text-status-availText",
      dot: "bg-[#1B6B3A]",
    },
    on_order: {
      label: "Na zamówienie",
      bg: "bg-status-orderBg",
      text: "text-status-orderText",
      dot: "bg-[#7A4F00]",
    },
    unavailable: {
      label: "Niedostępny",
      bg: "bg-status-unavailBg",
      text: "text-status-unavailText",
      dot: "bg-[#A8281D]",
    },
  }[status];

  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-xs font-medium ${config.bg} ${config.text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
        <span>{config.label}</span>
      </span>
      {showNote && status === "on_order" && leadTimeNote && (
        <span className="text-xs text-shop-muted">{leadTimeNote}</span>
      )}
    </div>
  );
}
