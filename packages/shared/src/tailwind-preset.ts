import type { Config } from "tailwindcss";
export const brandPreset = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "var(--brand-primary)",
          soft: "var(--brand-primary-soft)",
          bg: "var(--brand-bg)",
          surface: "var(--brand-surface)",
          ink: "var(--brand-ink)",
          muted: "var(--brand-muted)",
          border: "var(--brand-border)",
        }
      },
      borderRadius: {
        card: "var(--radius-card)",
        pill: "var(--radius-pill)",
      }
    }
  }
} satisfies Config;
