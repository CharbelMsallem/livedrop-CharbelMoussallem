// apps/storefront/src/app.tsx

import { useState } from 'react';
import { useUserStore } from './lib/store';
import { Header } from './components/organisms/Header';
import { SupportPanel } from './components/organisms/SupportPanel';
import { Router, Route, Routes } from './lib/router';
import { CatalogPage } from './pages/catalog';
import { ProductPage } from './pages/product';
import { CartPage } from './pages/cart';
import { CheckoutPage } from './pages/checkout';
import { OrderStatusPage } from './pages/order-status';
import { UserLogin } from './components/molecules/UserLogin';
import { ProfilePage } from './pages/ProfilePage'; // Import the new ProfilePage

export function App() {
  const { customer, setCustomer } = useUserStore();
  const [isSupportOpen, setSupportOpen] = useState(false);

  if (!customer) {
    return <UserLogin onLoginSuccess={setCustomer} />;
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header onSupportOpen={() => setSupportOpen(true)} />
        <main className="flex-1">
          {/* Wrap your Route components in the new Routes component */}
          <Routes>
            <Route path="/" component={CatalogPage} />
            <Route path="/products/:id" component={ProductPage} />
            <Route path="/cart" component={CartPage} />
            <Route path="/checkout" component={CheckoutPage} />
            <Route path="/order-status" component={OrderStatusPage} />
            <Route path="/profile" component={ProfilePage} /> 
          </Routes>
        </main>
        <SupportPanel
          isOpen={isSupportOpen}
          onClose={() => setSupportOpen(false)}
        />
      </div>
    </Router>
  );
}