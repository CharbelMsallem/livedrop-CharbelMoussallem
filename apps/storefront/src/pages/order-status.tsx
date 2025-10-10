import { useState, useEffect } from 'react';
import { useRouter, Link } from '../lib/router';
import { getOrderStatus, OrderStatus } from '../lib/api';
import { formatDate } from '../lib/format';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';

export function OrderStatusPage() {
  const { params } = useRouter();
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (params.id) {
      const status = getOrderStatus(params.id);
      setOrder(status);
      setLoading(false);
    }
  }, [params.id]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Not Found</h1>
        <p className="text-gray-600 mb-8">We couldn't find an order with that ID.</p>
        <Link to="/">
          <Button>Return to Shop</Button>
        </Link>
      </div>
    );
  }
  
  const statusSteps = [
    { key: 'Placed', label: 'Order Placed', icon: '📝' },
    { key: 'Packed', label: 'Packed', icon: '📦' },
    { key: 'Shipped', label: 'Shipped', icon: '🚚' },
    { key: 'Delivered', label: 'Delivered', icon: '✅' },
  ];
  
  const currentStepIndex = statusSteps.findIndex(s => s.key === order.status);
  
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'success';
      case 'Shipped':
        return 'info';
      case 'Packed':
        return 'warning';
      default:
        return 'default';
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-8 mb-8">
        <h1 className="text-4xl font-bold mb-2">Order Confirmation</h1>
        <p className="text-purple-100 text-lg">Thank you for your purchase!</p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order #{order.orderId}</h2>
            <p className="text-gray-600">Placed on {formatDate(order.placedAt)}</p>
          </div>
          <Badge variant={getStatusVariant(order.status)}>
            {order.status}
          </Badge>
        </div>
        
        <div className="relative">
          <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500"
              style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
            />
          </div>
          
          <div className="relative grid grid-cols-4 gap-4">
            {statusSteps.map((step, index) => {
              const isComplete = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              
              return (
                <div key={step.key} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                      isComplete
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white scale-110'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    <span className="text-xl">{step.icon}</span>
                  </div>
                  <p className={`text-sm font-semibold text-center ${isCurrent ? 'text-purple-600' : 'text-gray-600'}`}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {(order.status === 'Shipped' || order.status === 'Delivered') && order.carrier && order.eta && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Shipping Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Carrier</p>
              <p className="font-semibold text-gray-900">{order.carrier}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">
                {order.status === 'Delivered' ? 'Delivered On' : 'Estimated Delivery'}
              </p>
              <p className="font-semibold text-gray-900">{order.eta}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Link to="/" className="flex-1">
          <Button variant="outline" className="w-full">
            Continue Shopping
          </Button>
        </Link>
        <Button variant="primary" className="flex-1">
          Contact Support
        </Button>
      </div>
    </div>
  );
}