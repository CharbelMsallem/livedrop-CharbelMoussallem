// apps/storefront/src/pages/order-status.tsx

import { useEffect, useState } from 'react';
import { useRouter } from '../lib/router';
import { getOrderStatus, Order } from '../lib/api';
import { sseClient } from '../lib/sse-client';

export function OrderStatusPage() {
    const { params } = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // The router now correctly uses `params` instead of `query`
        const orderId = new URLSearchParams(window.location.search).get('orderId');
        if (!orderId) {
            setLoading(false);
            return;
        };

        // Initial fetch to get the order details right away
        getOrderStatus(orderId)
            .then(data => {
                setOrder(data);
            })
            .catch(err => console.error("Failed to fetch initial order status:", err))
            .finally(() => {
                setLoading(false);
            });

        // Establish the SSE connection for live updates
        const sse = sseClient.connect(orderId);
        
        // Define what happens when a message is received
        sse.onmessage = (event) => {
            const updatedOrder = JSON.parse(event.data);
            setOrder(updatedOrder);
        };

        // Cleanup function to close the connection when the component unmounts
        return () => sse.close();
    }, [params]);

    if (loading) {
        return <div className="text-center py-12">Loading order status...</div>;
    }

    if (!order) {
        return <div className="text-center py-12">Order not found.</div>;
    }

    return (
        <div className="max-w-2xl mx-auto py-12 px-4 animate-fade-in">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Your Order Status</h1>
                <p className="text-gray-600">Order ID: <span className="font-mono text-sm bg-gray-100 p-1 rounded">{order._id}</span></p>
            </div>

            <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Status:</span>
                    <span className="font-bold text-primary capitalize">{order.status.toLowerCase()}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Carrier:</span>
                    <span>{order.carrier || 'Not yet assigned'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Estimated Delivery:</span>
                    <span>{order.estimatedDelivery || 'Pending'}</span>
                </div>
            </div>
        </div>
    );
}