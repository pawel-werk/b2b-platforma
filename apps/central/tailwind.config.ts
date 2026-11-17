import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Zakładamy, że @fontsource/plus-jakarta-sans jest zainstalowane (npm i @fontsource/plus-jakarta-sans)
        sans: ['"Plus Jakarta Sans"', 'sans-serif'], 
      },
      colors: {
        brand: {
          primary: "#4F7A5E",
          soft: "#E6EFE8",
          surface: "#F4F6F4",
          ink: "#2A322D",
          muted: "#8B938D",
          border: "#E3E7E3",
          bg: "#FFFFFF"
        }
      },
      borderRadius: {
        'pill': '9999px',
        'card': '24px',
      }
    },
  },
  plugins: [],
};
export default config;
