/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CENTRAL_URL?: string;
  readonly VITE_SHOP_SLUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
