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
import { Button } from "./components/atoms/Button";

function DeliveryConfirmationModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Store the element that had focus before modal opened
    previouslyFocusedElement.current = document.activeElement as HTMLElement;
    
    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden';
    
    const focusableElementsQuery = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    
    // Focus first element after a brief delay for animation
    const timer = setTimeout(() => {
      if (modalRef.current) {
        const firstFocusableElement = modalRef.current.querySelector(focusableElementsQuery) as HTMLElement | null;
        if (firstFocusableElement) {
          firstFocusableElement.focus();
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      // Restore body scroll
      document.body.style.overflow = '';
      // Return focus to previously focused element
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Close modal on Escape
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    // Handle Tab and Shift+Tab for focus trapping
    if (e.key === 'Tab') {
      const focusableElementsQuery = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const focusableElements = modalRef.current?.querySelectorAll(focusableElementsQuery);
      
      if (!focusableElements || focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      // Shift+Tab on first element: cycle to last
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
      // Tab on last element: cycle to first
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Close modal when clicking outside the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      ref={modalRef}
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delivery-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-sm m-auto text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 id="delivery-modal-title" className="text-2xl font-bold mb-2">Order Delivered!</h2>
        <p className="text-gray-600 mb-6">Your order #{orderId} has been successfully delivered.</p>
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

  const handleOrderDelivered = (orderId: string) => {
    setDeliveredOrderId(orderId);
  };

  const renderPage = () => {
    if (path.startsWith("/p/")) {
      return <ProductPage />;
    }
    if (path === "/cart") {
      return <CartPage />;
    }
    if (path === "/checkout") {
      return <CheckoutPage />;
    }
    if (path.startsWith("/order/")) {
      return <OrderStatusPage onOrderDelivered={handleOrderDelivered} />;
    }
    return <CatalogPage />;
  };

  return (
    <div className="min-h-screen">
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