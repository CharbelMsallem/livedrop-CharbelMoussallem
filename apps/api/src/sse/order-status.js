import express from 'express';
import { getDb } from '../db.js';
import { ObjectId } from 'mongodb';

const router = express.Router();


export const clients = {};
const activeSimulations = new Set(); // Use a Set to track active simulations

router.get('/:id/stream', async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid order ID format" });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now();
    clients[clientId] = { res, orderId: id };
    console.log(`SSE Client ${clientId} connected for order ${id}. Total clients: ${Object.keys(clients).length}`);

    const sendEvent = (data) => {
        if (clients[clientId]) {
            clients[clientId].res.write(`data: ${JSON.stringify(data)}\n\n`);
        }
    };

    const db = getDb();
    let order = await db.collection('orders').findOne({ _id: new ObjectId(id) });
    if (!order) {
        sendEvent({ error: 'Order not found' });
        res.end();
        return;
    }
    sendEvent(order);

    // Only start a new simulation if one isn't already active for this order
    if (order.status !== 'DELIVERED' && !activeSimulations.has(id)) {
        activeSimulations.add(id);
        simulateOrderStatus(id);
    } else if (order.status === 'DELIVERED') {
        res.end();
    }

    req.on('close', () => {
        console.log(`SSE Client ${clientId} disconnected for order ${id}.`);
        delete clients[clientId];
        console.log(`Total SSE clients remaining: ${Object.keys(clients).length}`);

        const isStillActive = Object.values(clients).some(c => c.orderId === id);
        if (!isStillActive) {
            console.log(`No more clients for order ${id}. Simulation will continue on backend.`);
        }
        res.end();
    });
});

async function simulateOrderStatus(orderId) {
    const db = getDb();
    const statuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    
    let currentOrder = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
    let currentIndex = statuses.indexOf(currentOrder.status);

    const advanceStatus = async () => {
        // If the simulation is no longer marked as active (e.g., it's finished), stop.
        if (!activeSimulations.has(orderId)) {
            return; 
        }

        currentIndex++;
        if (currentIndex < statuses.length) {
            const nextStatus = statuses[currentIndex];
            console.log(`Updating order ${orderId} to status: ${nextStatus}`);

            const updateData = { status: nextStatus, updatedAt: new Date() };
            if (nextStatus === 'SHIPPED') {
                updateData.carrier = ['FedEx', 'UPS', 'DHL'][Math.floor(Math.random() * 3)];
                updateData.estimatedDelivery = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
            }

            await db.collection('orders').updateOne({ _id: new ObjectId(orderId) }, { $set: updateData });
            const updatedOrder = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });

            // Send update to all connected clients for this order
            Object.values(clients).forEach(client => {
                if (client.orderId === orderId) {
                    client.res.write(`data: ${JSON.stringify(updatedOrder)}\n\n`);
                }
            });

            if (nextStatus !== 'DELIVERED') {
                setTimeout(advanceStatus, 5000);
            } else {
                console.log(`Order ${orderId} is DELIVERED. Ending simulation.`);
                activeSimulations.delete(orderId); // Mark simulation as complete
                // Close any remaining connections for this order
                Object.keys(clients).forEach(clientId => {
                    if (clients[clientId].orderId === orderId) {
                        clients[clientId].res.end();
                    }
                });
            }
        }
    };

    setTimeout(advanceStatus, 3000);
}

export default router;