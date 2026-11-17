const API_URL = "http://localhost:3000/api/public/v1";

export async function resolveShop() {
  const res = await fetch(`${API_URL}/shops/resolve`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Serwer odrzucił żądanie (Status: ${res.status}). Detale: ${text}`);
  }
  return res.json();
}

export async function getShopData(slug: string) {
  const [infoRes, productsRes] = await Promise.all([
    fetch(`${API_URL}/shops/${slug}`),
    fetch(`${API_URL}/shops/${slug}/products`)
  ]);
  if (!infoRes.ok || !productsRes.ok) throw new Error("Błąd pobierania danych sklepu.");
  return { info: await infoRes.json(), products: await productsRes.json() };
}

export async function getVersion(slug: string) {
  const res = await fetch(`${API_URL}/shops/${slug}/version`);
  return res.json();
}

export async function createOrder(slug: string, customerData: any, items: {id: string, qty: number}[]) {
  const res = await fetch(`${API_URL}/shops/${slug}/orders`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerData, items, returnUrl: `${window.location.origin}/wynik` })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data;
}
