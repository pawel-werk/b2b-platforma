import type { Config } from "tailwindcss";
import { brandPreset } from "../../packages/shared/src/tailwind-preset";

const config: Config = {
  presets: [brandPreset],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-jakarta)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
