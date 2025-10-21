// src/pages/order-status.tsx

import { useEffect, useState } from 'react';
import { useRouter } from '../lib/router';
import { Order } from '../lib/api';
import { sseClient } from '../lib/sse-client';
import { OrderTracking } from '../components/molecules/OrderTracking';
import { Button } from '../components/atoms/Button';
import { formatCurrency } from '../lib/format';

export function OrderStatusPage() {
  const { navigate } = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  const isDelivered = order?.status === 'DELIVERED';

  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get('orderId');
    if (!orderId) {
      setError('No order ID found in the URL.');
      setIsProcessing(false);
      return;
    }

    const sse = sseClient.connect(orderId);

    sse.onmessage = (event) => {
      try {
        const data: Order & { error?: string } = JSON.parse(event.data);
        if (data.error) {
          setError(data.error);
          setIsProcessing(false);
          sseClient.close();
        } else {
          setOrder(data);
          if (data.status === 'DELIVERED') {
            setIsProcessing(false);
            sseClient.close();
          } else {
            setIsProcessing(true);
          }
        }
      } catch (e) {
        setError('There was an issue processing the live order update.');
        setIsProcessing(false);
        sseClient.close();
      }
    };

    sse.onerror = () => {
      setError('Connection to the live order stream was lost. Please refresh.');
      setIsProcessing(false);
      sseClient.close();
    };

    return () => sseClient.close();
  }, []);

  const renderHeader = () => {
    if (isDelivered) {
      return (
        <div className="text-center p-6 sm:p-8 bg-white rounded-xl shadow-lg animate-fade-in">
           <div className="w-16 h-16 mx-auto mb-4 bg-teal-100 text-primary rounded-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Thank You For Your Purchase!</h1>
          <p className="text-gray-500 mb-6">Your order has been delivered successfully.</p>
          <Button onClick={() => navigate('/')} variant="primary" size="md">
            Continue Shopping
          </Button>
        </div>
      );
    }

    return (
      <div className="text-center p-6 sm:p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Tracking Your Order</h1>
        <p className="text-gray-600 mb-1">
          Order ID: {order ? <span className="font-mono text-sm bg-gray-100 p-1 rounded">{order._id}</span> : <span className="inline-block bg-gray-200 rounded h-5 w-48 animate-pulse" />}
        </p>
      </div>
    );
  };

  const renderOrderDetails = () => {
    if (!order) {
      // Skeleton loader
      return (
        <div className="space-y-6 animate-pulse">
          <div className="bg-white rounded-xl shadow-lg p-6 h-48" />
          <div className="bg-white rounded-xl shadow-lg p-6 h-64" />
        </div>
      );
    }

    const subtotal = (order.total - 5.99) / 1.08;
    const tax = subtotal * 0.08;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <OrderTracking order={order} />
          {isProcessing && (
             <div className="flex items-center justify-center gap-3 mt-6 pt-6 border-t">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <p className="font-semibold text-gray-600 text-sm">Live updates in progress...</p>
             </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 border-b pb-3">Order Summary</h2>
          {order.items.map((item) => (
            <div key={item.productId} className="flex gap-4 items-center py-4 border-b last:border-b-0">
              <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
              </div>
              <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
            </div>
          ))}
          <div className="space-y-2 pt-4 mt-2">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span>Shipping</span><span className="font-medium">{formatCurrency(5.99)}</span></div>
            <div className="flex justify-between text-sm"><span>Taxes</span><span className="font-medium">{formatCurrency(tax)}</span></div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t mt-2"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-6">
        {renderHeader()}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}
        {renderOrderDetails()}
      </div>
    </div>
  );
}