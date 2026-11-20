import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ShopProvider } from "./context/ShopContext";
import { AnnouncementBar } from "./components/AnnouncementBar";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ToastContainer } from "./components/ToastContainer";
import { HomePage } from "./pages/HomePage";
import { ShopListPage } from "./pages/ShopListPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { CartCheckoutPage } from "./pages/CartCheckoutPage";
import { OrderLookupPage } from "./pages/OrderLookupPage";
import { LegalPage, NotFoundPage } from "./pages/LegalAndNotFoundPages";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ShopProvider>
          <div className="min-h-screen flex flex-col bg-shop-bg text-shop-ink">
            <AnnouncementBar />
            <Header />
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/sklep" element={<ShopListPage />} />
                <Route path="/sklep/:kategoria" element={<ShopListPage />} />
                <Route path="/produkt/:slug" element={<ProductDetailPage />} />
                <Route path="/koszyk" element={<CartCheckoutPage />} />
                <Route path="/zamowienia" element={<OrderLookupPage />} />
                <Route path="/zamowienie/:token" element={<OrderLookupPage />} />
                <Route path="/regulamin" element={<LegalPage title="Regulamin sklepu" />} />
                <Route
                  path="/polityka-prywatnosci"
                  element={<LegalPage title="Polityka prywatności" />}
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </div>
            <Footer />
            <ToastContainer />
          </div>
        </ShopProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;