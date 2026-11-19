import type {
  ShopResolveResponse,
  ShopCatalogResponse,
  CatalogProduct,
  DeliverySettings,
  CheckoutRequest,
  OrderStatusView,
} from "@repo/shared";

const SESSION_SLUG_KEY = "b2c_active_shop_slug";

export function getCentralBaseUrl(): string {
  const envUrl = import.meta.env.VITE_CENTRAL_URL;
  if (envUrl) return String(envUrl).replace(/\/$/, "");
  return "";
}

export function resolveAssetUrl(url: string | undefined | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const base = import.meta.env.VITE_CENTRAL_URL
    ? String(import.meta.env.VITE_CENTRAL_URL).replace(/\/$/, "")
    : "http://localhost:3000";
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function detectShopTarget(): { mode: "slug" | "host"; value: string } {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const queryShop = params.get("shop")?.trim().toLowerCase();
    if (queryShop) {
      sessionStorage.setItem(SESSION_SLUG_KEY, queryShop);
      return { mode: "slug", value: queryShop };
    }

    const storedSlug = sessionStorage.getItem(SESSION_SLUG_KEY)?.trim().toLowerCase();
    if (storedSlug) {
      return { mode: "slug", value: storedSlug };
    }
  }

  const envSlug = import.meta.env.VITE_SHOP_SLUG?.trim().toLowerCase();
  if (envSlug) {
    return { mode: "slug", value: envSlug };
  }

  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  if (host === "localhost" || host === "127.0.0.1") {
    return { mode: "slug", value: "villeroy" };
  }
  return { mode: "host", value: host };
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getCentralBaseUrl();
  const url = `${base}${path}`;

  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (init?.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch (err) {
    const isLocal =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    if (!isLocal) throw err;

    res = await fetch(`http://localhost:3000${path}`, { ...init, headers });
  }

  if (!res.ok) {
    let errBody: Record<string, unknown> = {};
    try {
      errBody = await res.json();
    } catch {}
    const error = new Error(String(errBody.message || errBody.error || `Błąd HTTP ${res.status}`)) as Error & {
      status?: number;
      data?: unknown;
    };
    error.status = res.status;
    error.data = errBody;
    throw error;
  }

  return res.json() as Promise<T>;
}

export async function apiResolveShop(): Promise<ShopResolveResponse> {
  const target = detectShopTarget();
  const query =
    target.mode === "slug"
      ? `slug=${encodeURIComponent(target.value)}`
      : `host=${encodeURIComponent(target.value)}`;
  return fetchJson<ShopResolveResponse>(`/api/public/v1/shops/resolve?${query}`);
}

export async function apiGetCatalog(slug: string): Promise<ShopCatalogResponse> {
  return fetchJson<ShopCatalogResponse>(`/api/public/v1/shops/${encodeURIComponent(slug)}/catalog`);
}

export async function apiGetProduct(slug: string, productSlug: string): Promise<CatalogProduct> {
  return fetchJson<CatalogProduct>(
    `/api/public/v1/shops/${encodeURIComponent(slug)}/products/${encodeURIComponent(productSlug)}`
  );
}

export async function apiGetCheckoutOptions(slug: string): Promise<DeliverySettings> {
  return fetchJson<DeliverySettings>(`/api/public/v1/shops/${encodeURIComponent(slug)}/checkout-options`);
}

export async function apiSubmitCheckout(slug: string, payload: CheckoutRequest) {
  return fetchJson<{
    orderNumber: string;
    orderToken: string;
    paymentUrl: string;
    totals: {
      itemsNettoGrosze: number;
      itemsBruttoGrosze: number;
      shippingBruttoGrosze: number;
      totalBruttoGrosze: number;
    };
  }>(`/api/public/v1/shops/${encodeURIComponent(slug)}/checkout`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiGetOrderByToken(token: string): Promise<OrderStatusView> {
  return fetchJson<OrderStatusView>(`/api/public/v1/orders/${encodeURIComponent(token)}`);
}

export async function apiLookupOrder(
  slug: string,
  orderNumber: string,
  email: string
): Promise<OrderStatusView> {
  return fetchJson<OrderStatusView>(`/api/public/v1/shops/${encodeURIComponent(slug)}/orders/lookup`, {
    method: "POST",
    body: JSON.stringify({ orderNumber, email }),
  });
}