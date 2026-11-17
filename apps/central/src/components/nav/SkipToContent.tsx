export function SkipToContent() {
  return (
    <a 
      href="#main-content" 
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-primary focus:text-white focus:rounded-pill focus:font-bold focus:outline-none focus:ring-4 focus:ring-brand-primary/50 transition-all"
    >
      Przejdź do głównej treści
    </a>
  );
}
