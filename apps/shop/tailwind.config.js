/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ['"Figtree"', "sans-serif"],
      },
      colors: {
        shop: {
          bg: "#FAF8F5",
          surface: "#F1EDE7",
          surfaceDeep: "#E7DFD4",
          ink: "#1C1A17",
          muted: "#7B746A",
          line: "#E6E0D7",
          bronze: "#8C735A",
          footer: "#1F1B17",
          footerText: "#EDE7DE",

          // Aliasy dla nieprzerobionych jeszcze komponentów
          navy: "var(--shop-navy, #1C1A17)",
          accent: "var(--shop-accent, #8C735A)",
          text: "#1C1A17",
          border: "#E6E0D7",
        },
        status: {
          avail: "#4F6B52",
          order: "#8A6A33",
          unavail: "#9A4A3F",
          availText: "#4F6B52",
          availBg: "transparent",
          orderText: "#8A6A33",
          orderBg: "transparent",
          unavailText: "#9A4A3F",
          unavailBg: "transparent",
        },
      },
      borderRadius: {
        card: "2px",
        pill: "2px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 600ms ease-out forwards",
      },
    },
  },
  plugins: [],
};