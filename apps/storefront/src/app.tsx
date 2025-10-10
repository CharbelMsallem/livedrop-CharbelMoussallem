import { useState } from "react";
import { RouterProvider, useRouter } from "./lib/router";
import { Header } from "./components/organisms/Header";
import { CartDrawer } from "./components/organisms/CartDrawer";
import { SupportPanel } from "./components/organisms/SupportPanel";
import { CatalogPage } from "./pages/catalog";
import { ProductPage } from "./pages/product";
import { CartPage } from "./pages/cart";
import { CheckoutPage } from "./pages/checkout";
import { OrderStatusPage } from "./pages/order-status";

function AppContent() {
  const { path } = useRouter();
  const [cartOpen, setCartOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  const renderPage = () => {
    if (path.startsWith("/p/")) {
      return <ProductPage />;
    } else if (path === "/cart") {
      return <CartPage />;
    } else if (path === "/checkout") {
      return <CheckoutPage />;
    } else if (path.startsWith("/order/")) {
      return <OrderStatusPage />;
    }
    return <CatalogPage />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onCartOpen={() => setCartOpen(true)}
        onSupportOpen={() => setSupportOpen(true)}
      />
      <main className="pb-12">{renderPage()}</main>
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <SupportPanel
        isOpen={supportOpen}
        onClose={() => setSupportOpen(false)}
      />
    </div>
  );
}

export function App() {
  return (
    <RouterProvider>
      <AppContent />
    </RouterProvider>
  );
}
