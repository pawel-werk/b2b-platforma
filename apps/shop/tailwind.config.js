/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Figtree"', "sans-serif"],
      },
      colors: {
        shop: {
          navy: "var(--shop-navy, #0B2545)",
          accent: "var(--shop-accent, #1E5BC6)",
          text: "#14223B",
          muted: "#5E6B80",
          surface: "#EEF2F7",
          border: "#D9E1EC",
          bg: "#FFFFFF",
        },
        status: {
          availText: "#1B6B3A",
          availBg: "#E3F4EA",
          orderText: "#7A4F00",
          orderBg: "#FFF1CC",
          unavailText: "#A8281D",
          unavailBg: "#FDE7E5",
        },
      },
      borderRadius: {
        card: "10px",
        pill: "9999px",
      },
    },
  },
  plugins: [],
};
