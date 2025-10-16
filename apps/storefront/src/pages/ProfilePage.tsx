// apps/storefront/src/pages/ProfilePage.tsx

import { useState, useEffect } from 'react';
import { useUserStore } from '../lib/store';
import { getCustomerOrders, Order } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/format';
import { useRouter } from '../lib/router';
import { Badge } from '../components/atoms/Badge';
import { Button } from '../components/atoms/Button';

const ORDERS_PER_PAGE = 4;

export function ProfilePage() {
  const { customer } = useUserStore();
  const { navigate } = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {

      async function loadOrders() {
        if (!customer) {
          navigate('/');
          return;
        }
      try {
        const userOrders = await getCustomerOrders(customer.email);
        setOrders(userOrders);
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [customer, navigate]);

  // Pagination Logic
  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
  const paginatedOrders = orders.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusVariant = (status: Order['status']) => {
    switch (status) {
      case 'DELIVERED':
        return 'success';
      case 'SHIPPED':
        return 'info';
      case 'PROCESSING':
      case 'PENDING':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {customer?.name}</h1>
        <p className="text-gray-600">Here's a summary of your account and order history.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-xl font-bold border-b pb-3 mb-4">Account Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-semibold text-gray-500">Name</p>
            <p>{customer?.name}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500">Email</p>
            <p>{customer?.email}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500">Address</p>
            <p>{customer?.address}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Your Orders</h2>
          {totalPages > 1 && (
            <span className="text-sm font-semibold text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>
        {orders.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paginatedOrders.map(order => (
                <div key={order._id} className="bg-white p-4 rounded-xl shadow-md transition-all hover:shadow-lg flex flex-col">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-3 mb-3">
                    <div>
                      <p className="font-semibold text-sm">Order ID:</p>
                      <p className="font-mono text-xs bg-gray-100 p-1 rounded inline-block">{order._id}</p>
                      <p className="text-xs text-gray-500 mt-1">Placed on: {formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-left sm:text-right mt-2 sm:mt-0">
                      <p className="font-bold text-lg">{formatCurrency(order.total)}</p>
                      <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                    </div>
                  </div>
                  <div className="space-y-2 flex-1">
                    {order.items.map(item => (
                      <div key={item.productId} className="flex items-center gap-3 text-sm">
                        <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-md object-cover" />
                        <div className="flex-1">
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <Button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <p className="text-gray-500">You haven't placed any orders yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}