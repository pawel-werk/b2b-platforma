/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          bg: 'var(--brand-bg)',
          ink: 'var(--brand-ink)',
        }
      },
      borderRadius: { card: 'var(--radius)' }
    },
  },
  plugins: [],
}
