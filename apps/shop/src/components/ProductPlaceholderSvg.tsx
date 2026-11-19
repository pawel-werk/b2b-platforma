import React from "react";

interface ProductPlaceholderSvgProps {
  name: string;
  colorHex?: string;
  colorLabel?: string;
  className?: string;
}

type ProductKind =
  | "oven"
  | "hob"
  | "hood"
  | "fridge"
  | "dishwasher"
  | "faucet"
  | "coffee"
  | "microwave"
  | "sink";

function detectProductKind(name: string): ProductKind {
  const n = name.toLowerCase();
  if (n.includes("piekarnik") || n.includes("oven")) return "oven";
  if (n.includes("płyta") || n.includes("plyta") || n.includes("indukc") || n.includes("gazow")) return "hob";
  if (n.includes("okap") || n.includes("pochłaniacz") || n.includes("pochlaniacz") || n.includes("hood")) return "hood";
  if (n.includes("lodówk") || n.includes("lodowk") || n.includes("chłodziark") || n.includes("chlodziark") || n.includes("winiark") || n.includes("zamrażark")) return "fridge";
  if (n.includes("zmywark") || n.includes("dishwasher")) return "dishwasher";
  if (n.includes("bateri") || n.includes("kran") || n.includes("wylewk")) return "faucet";
  if (n.includes("ekspres") || n.includes("kaw")) return "coffee";
  if (n.includes("mikrofal")) return "microwave";
  return "sink";
}

export function ProductPlaceholderSvg({
  name,
  colorHex = "#F3F2EE",
  colorLabel,
  className = "w-full h-full",
}: ProductPlaceholderSvgProps) {
  const kind = detectProductKind(name);

  return (
    <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
      <svg viewBox="0 0 200 170" className="w-40 h-36" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Cień pod produktem */}
        <ellipse cx="100" cy="152" rx="58" ry="8" fill="#0F172A" fillOpacity="0.08" />

        {kind === "oven" && (
          <g>
            {/* Korpus piekarnika */}
            <rect x="38" y="24" width="124" height="122" rx="10" fill={colorHex} stroke="#CBD5E1" strokeWidth="3" />
            {/* Panel sterowania */}
            <rect x="44" y="30" width="112" height="22" rx="4" fill="#0F172A" fillOpacity="0.08" />
            <circle cx="62" cy="41" r="4" fill="#475569" />
            <rect x="82" y="37" width="36" height="8" rx="3" fill="#334155" />
            <circle cx="138" cy="41" r="4" fill="#475569" />
            {/* Uchwyt */}
            <rect x="56" y="60" width="88" height="5" rx="2.5" fill="#64748B" />
            {/* Szyba piekarnika */}
            <rect x="52" y="72" width="96" height="62" rx="6" fill="#1E293B" fillOpacity="0.82" />
            <path d="M62 82L84 82" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}

        {kind === "hob" && (
          <g>
            {/* Płyta grzewcza w lekkim rzucie */}
            <rect x="28" y="36" width="144" height="104" rx="10" fill={colorHex} stroke="#CBD5E1" strokeWidth="3" />
            <circle cx="66" cy="68" r="18" stroke="#475569" strokeWidth="2.5" strokeDasharray="4 3" />
            <circle cx="66" cy="68" r="7" stroke="#475569" strokeWidth="2" />
            <circle cx="132" cy="68" r="15" stroke="#475569" strokeWidth="2.5" strokeDasharray="4 3" />
            <circle cx="66" cy="110" r="14" stroke="#475569" strokeWidth="2.5" strokeDasharray="4 3" />
            <circle cx="132" cy="108" r="20" stroke="#475569" strokeWidth="2.5" strokeDasharray="4 3" />
            <rect x="78" y="128" width="44" height="5" rx="2.5" fill="#64748B" />
          </g>
        )}

        {kind === "hood" && (
          <g>
            {/* Komin okapu */}
            <rect x="78" y="20" width="44" height="68" rx="4" fill={colorHex} stroke="#CBD5E1" strokeWidth="3" />
            {/* Czasza okapu */}
            <path d="M32 126L56 88H144L168 126H32Z" fill={colorHex} stroke="#CBD5E1" strokeWidth="3" strokeLinejoin="round" />
            <rect x="32" y="126" width="136" height="14" rx="4" fill={colorHex} stroke="#CBD5E1" strokeWidth="3" />
            <circle cx="88" cy="133" r="2.5" fill="#475569" />
            <circle cx="100" cy="133" r="2.5" fill="#475569" />
            <circle cx="112" cy="133" r="2.5" fill="#475569" />
          </g>
        )}

        {kind === "fridge" && (
          <g>
            {/* Chłodziarka / winiarka */}
            <rect x="52" y="18" width="96" height="130" rx="10" fill={colorHex} stroke="#CBD5E1" strokeWidth="3" />
            <line x1="52" y1="96" x2="148" y2="96" stroke="#CBD5E1" strokeWidth="3" />
            <rect x="64" y="46" width="5" height="36" rx="2.5" fill="#64748B" />
            <rect x="64" y="108" width="5" height="24" rx="2.5" fill="#64748B" />
          </g>
        )}

        {kind === "dishwasher" && (
          <g>
            <rect x="40" y="24" width="120" height="122" rx="10" fill={colorHex} stroke="#CBD5E1" strokeWidth="3" />
            <rect x="46" y="30" width="108" height="18" rx="4" fill="#0F172A" fillOpacity="0.08" />
            <rect x="76" y="36" width="48" height="6" rx="3" fill="#64748B" />
            <line x1="40" y1="54" x2="160" y2="54" stroke="#CBD5E1" strokeWidth="2.5" />
          </g>
        )}

        {kind === "faucet" && (
          <g>
            {/* Bateria kuchenna */}
            <path d="M84 142V62C84 38 128 38 128 62V78" stroke={colorHex} strokeWidth="14" strokeLinecap="round" />
            <path d="M84 142V62C84 38 128 38 128 62V78" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
            <rect x="70" y="136" width="28" height="10" rx="5" fill={colorHex} stroke="#CBD5E1" strokeWidth="2.5" />
            <line x1="84" y1="114" x2="108" y2="106" stroke="#64748B" strokeWidth="5" strokeLinecap="round" />
          </g>
        )}

        {kind === "coffee" && (
          <g>
            <rect x="42" y="28" width="116" height="114" rx="10" fill={colorHex} stroke="#CBD5E1" strokeWidth="3" />
            <rect x="54" y="40" width="92" height="20" rx="4" fill="#1E293B" fillOpacity="0.85" />
            <rect x="64" y="72" width="72" height="54" rx="6" fill="#0F172A" fillOpacity="0.1" />
            <rect x="92" y="76" width="16" height="12" rx="2" fill="#475569" />
            <path d="M86 104H114L110 122H90L86 104Z" fill="#FFFFFF" stroke="#64748B" strokeWidth="2.5" />
          </g>
        )}

        {kind === "microwave" && (
          <g>
            <rect x="30" y="44" width="140" height="92" rx="10" fill={colorHex} stroke="#CBD5E1" strokeWidth="3" />
            <rect x="42" y="56" width="84" height="68" rx="6" fill="#1E293B" fillOpacity="0.82" />
            <circle cx="146" cy="72" r="5" fill="#475569" />
            <circle cx="146" cy="92" r="5" fill="#475569" />
            <rect x="138" y="110" width="16" height="6" rx="3" fill="#64748B" />
          </g>
        )}

        {kind === "sink" && (
          <g>
            {/* Domyślna umywalka / zlewozmywak */}
            <path d="M40 62C40 50 160 50 160 62L148 128C144 142 56 142 52 128L40 62Z" fill={colorHex} stroke="#CBD5E1" strokeWidth="3" />
            <ellipse cx="100" cy="62" rx="60" ry="14" fill="#FFFFFF" fillOpacity="0.65" stroke="#CBD5E1" strokeWidth="3" />
            <circle cx="100" cy="60" r="3" fill="#475569" />
            <ellipse cx="100" cy="74" rx="7" ry="3" fill="#475569" />
          </g>
        )}
      </svg>

      {colorLabel && (
        <span className="mt-2 text-[11px] font-semibold text-slate-700 text-center">
          {colorLabel}
        </span>
      )}
    </div>
  );
}