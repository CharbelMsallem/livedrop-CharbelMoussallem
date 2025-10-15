import { useState, useEffect, useRef } from "react";
import { RouterProvider, useRouter } from "./lib/router";
import { Header } from "./components/organisms/Header";
import { CartDrawer } from "./components/organisms/CartDrawer";
import { SupportPanel } from "./components/organisms/SupportPanel";
import { CatalogPage } from "./pages/catalog";
import { ProductPage } from "./pages/product";
import { CartPage } from "./pages/cart";
import { CheckoutPage } from "./pages/checkout";
import { OrderStatusPage } from "./pages/order-status";
import { UserLogin } from "./components/UserLogin";
import { Customer } from "./lib/api";
import { Button } from "./components/atoms/Button";

const SESSION_STORAGE_KEY = 'shoplite-current-user';

function DeliveryConfirmationModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const firstFocusableElement = modalRef.current?.querySelector('button');
    firstFocusableElement?.focus();

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      ref={modalRef}
      onKeyDown={handleKeyDown}
      onClick={onClose}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delivery-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-sm m-auto text-center" onClick={(e) => e.stopPropagation()}>
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 id="delivery-modal-title" className="text-2xl font-bold mb-2">Order Delivered!</h2>
        <p className="text-gray-600 mb-6">Your order #{orderId.slice(-6)} has been successfully delivered.</p>
        <Button onClick={onClose} className="w-full">
          Got it!
        </Button>
      </div>
    </div>
  );
}

function AppContent() {
  const { path } = useRouter();
  const [cartOpen, setCartOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [deliveredOrderId, setDeliveredOrderId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<Customer | null>(() => {
    try {
      const storedUser = sessionStorage.getItem(SESSION_STORAGE_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [currentUser]);

  if (!currentUser) {
    return <UserLogin onLoginSuccess={setCurrentUser} />;
  }
  
  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleOrderDelivered = (orderId: string) => {
    setDeliveredOrderId(orderId);
  };

  const renderPage = () => {
    if (path.startsWith("/p/")) return <ProductPage />;
    if (path === "/cart") return <CartPage />;
    if (path === "/checkout") return <CheckoutPage currentUser={currentUser} />;
    if (path.startsWith("/order/")) {
      return <OrderStatusPage onOrderDelivered={handleOrderDelivered} />;
    }
    return <CatalogPage />;
  };

  return (
    <div className="min-h-screen">
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onCartOpen={() => setCartOpen(true)}
        onSupportOpen={() => setSupportOpen(true)}
      />
      <main className="pb-12">{renderPage()}</main>
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <SupportPanel isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
      {deliveredOrderId && (
        <DeliveryConfirmationModal
          orderId={deliveredOrderId}
          onClose={() => setDeliveredOrderId(null)}
        />
      )}
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