import { useState, useEffect } from 'react';
import { useRouter, Link } from '../lib/router';
import { Order } from '../lib/api'; // <-- CORRECTED: Was OrderStatus
import { createOrderStatusStream } from '../lib/sse-client';
import { formatDate } from '../lib/format';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';

interface OrderStatusPageProps {
  onOrderDelivered: (orderId: string) => void;
}

export function OrderStatusPage({ onOrderDelivered }: OrderStatusPageProps) {
  const { params, navigate } = useRouter();
  const [order, setOrder] = useState<Order | null>(null); // <-- CORRECTED: Was OrderStatus
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) {
        setLoading(false);
        setError("No order ID provided.");
        return;
    };

    const eventSource = createOrderStatusStream(
      params.id,
      (updatedOrder) => {
        console.log('Received order update:', updatedOrder);
        setOrder(updatedOrder);
        if (loading) setLoading(false);
        if (updatedOrder.status === 'DELIVERED') {
            onOrderDelivered(updatedOrder._id);
            eventSource.close();
            setTimeout(() => navigate('/'), 3000);
        }
      },
      (err) => {
        console.error('SSE Error:', err);
        setError("Could not connect to the real-time order stream.");
        setLoading(false);
        eventSource.close();
      }
    );

    return () => {
      console.log("Closing SSE connection for order:", params.id);
      eventSource.close();
    };
  }, [params.id, navigate, onOrderDelivered]);

    // ... (rest of the component remains the same)
    // The JSX part for rendering the UI is already correct.
    if (loading) {
        return (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="ml-4 text-gray-600">Connecting to live order stream...</p>
          </div>
        );
      }
    
      if (error || !order) {
        return (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Not Found</h1>
            <p className="text-gray-600 mb-8">{error || "We couldn't find an order with that ID."}</p>
            <Link to="/">
              <Button>Return to Shop</Button>
            </Link>
          </div>
        );
      }
    
      const statusSteps = [
        { key: 'PENDING', label: 'Order Placed', icon: '📝' },
        { key: 'PROCESSING', label: 'Processing', icon: '📦' },
        { key: 'SHIPPED', label: 'Shipped', icon: '🚚' },
        { key: 'DELIVERED', label: 'Delivered', icon: '✅' },
      ];
      const currentStepIndex = statusSteps.findIndex(s => s.key === order.status);
    
      return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-2xl p-8 mb-8">
                <h1 className="text-4xl font-bold mb-2">Tracking Your Order</h1>
                <p className="text-teal-100 text-lg">This page updates automatically. No need to refresh!</p>
            </div>
    
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order #{order._id}</h2>
                        <p className="text-gray-600">Placed on {formatDate(order.createdAt)}</p>
                    </div>
                    <Badge variant={order.status === 'DELIVERED' ? 'success' : 'info'}>{order.status}</Badge>
                </div>
                
                <div className="relative pt-4">
                    <div className="absolute top-9 left-0 right-0 h-1 bg-gray-200 rounded-full">
                        <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-1000" style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }} />
                    </div>
                    <div className="relative grid grid-cols-4 gap-2 text-center">
                        {statusSteps.map((step, index) => (
                        <div key={step.key} className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${index <= currentStepIndex ? 'bg-gradient-to-r from-primary to-secondary text-white scale-110' : 'bg-gray-200 text-gray-400'}`}>
                            <span className="text-lg">{step.icon}</span>
                            </div>
                            <p className={`text-sm font-semibold ${index === currentStepIndex ? 'text-primary' : 'text-gray-600'}`}>{step.label}</p>
                        </div>
                        ))}
                    </div>
                </div>
            </div>
    
            {(order.status === 'SHIPPED' || order.status === 'DELIVERED') && order.carrier && order.estimatedDelivery && (
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Shipping Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><p className="text-sm text-gray-600 mb-1">Carrier</p><p className="font-semibold">{order.carrier}</p></div>
                        <div><p className="text-sm text-gray-600 mb-1">{order.status === 'DELIVERED' ? 'Delivered On' : 'Estimated Delivery'}</p><p className="font-semibold">{formatDate(order.estimatedDelivery)}</p></div>
                    </div>
                </div>
            )}
        </div>
      );
}