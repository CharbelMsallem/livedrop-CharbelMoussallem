// apps/storefront/src/app.tsx

import { useState, useEffect } from 'react';
import { useUserStore } from './lib/store';
import { Header } from './components/organisms/Header';
import { SupportAssistant } from './components/organisms/SupportAssistant';
import { Router, Route, Routes, useRouter } from './lib/router'; // Import useRouter here too
import { CatalogPage } from './pages/catalog';
import { ProductPage } from './pages/product';
import { CartPage } from './pages/cart';
import { CheckoutPage } from './pages/checkout';
import { OrderStatusPage } from './pages/order-status';
import { UserLogin } from './components/molecules/UserLogin';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboard';

// Component to handle global session effects
function SessionManager() {
  const { resetTimeout, customer, lastActivity, setCustomer } = useUserStore();
  const router = useRouter(); // Use the router hook

  // Reset timeout on route changes
  useEffect(() => {
    resetTimeout();
  }, [router.path, resetTimeout]); // Depend on router path

   // Periodic check for timeout (simple implementation)
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (customer && lastActivity) {
        const SESSION_TIMEOUT_MS = 20 * 60 * 1000;
        const now = Date.now();
        if (now - lastActivity > SESSION_TIMEOUT_MS) {
          console.log("Session timed out due to inactivity.");
          setCustomer(null); // Log out
        }
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, [customer, lastActivity, setCustomer]);


  return null; // This component doesn't render anything visible
}


export function App() {
  const { customer, setCustomer } = useUserStore();
  const [isSupportOpen, setSupportOpen] = useState(false);

  // Example: Reset timeout on window focus or click (more robust than just navigation)
  useEffect(() => {
    const handleActivity = () => {
      useUserStore.getState().resetTimeout();
    };
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('focus', handleActivity);

    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('focus', handleActivity);
    };
  }, []);


  if (!customer) {
    // Pass setCustomer directly
    return <UserLogin onLoginSuccess={setCustomer} />;
  }

  return (
    <Router>
       <SessionManager /> 
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header onSupportOpen={() => setSupportOpen(true)} />
        <main className="flex-1">
          <Routes>
            <Route path="/" component={CatalogPage} />
            <Route path="/products/:id" component={ProductPage} />
            <Route path="/cart" component={CartPage} />
            <Route path="/checkout" component={CheckoutPage} />
            <Route path="/order-status" component={OrderStatusPage} />
            <Route path="/profile" component={ProfilePage} />
            <Route path="/admin" component={AdminDashboardPage} />
          </Routes>
        </main>
        <SupportAssistant
          isOpen={isSupportOpen}
          onClose={() => setSupportOpen(false)}
        />
      </div>
    </Router>
  );
}