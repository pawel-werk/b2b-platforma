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
      text: "text-status-avail",
      dot: "bg-status-avail",
    },
    on_order: {
      label: "Na zamówienie",
      text: "text-status-order",
      dot: "bg-status-order",
    },
    unavailable: {
      label: "Niedostępny",
      text: "text-status-unavail",
      dot: "bg-status-unavail",
    },
  }[status];

  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      <span className={`inline-flex items-center gap-2 text-xs font-normal ${config.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} aria-hidden="true" />
        <span>{config.label}</span>
      </span>
      {showNote && status === "on_order" && leadTimeNote && (
        <span className="text-xs font-light text-shop-muted">· {leadTimeNote}</span>
      )}
    </div>
  );
}