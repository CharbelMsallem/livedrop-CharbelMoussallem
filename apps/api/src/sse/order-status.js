import express from 'express';
import { getDb } from '../db.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// This object will keep track of active client connections
const clients = {};

// The main SSE endpoint for a specific order
router.get('/:id/stream', async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid order ID format" });
    }

    // 1. Set SSE Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Send headers immediately

    // 2. Store this client connection
    const clientId = Date.now();
    clients[clientId] = res;
    console.log(`Client ${clientId} connected for order ${id}`);

    // Function to send an event to the client
    const sendEvent = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // 3. Send initial status immediately
    const db = getDb();
    let order = await db.collection('orders').findOne({ _id: new ObjectId(id) });
    if (!order) {
        sendEvent({ error: 'Order not found' });
        res.end();
        return;
    }
    sendEvent(order);

    // 4. Start the auto-simulation process if the order is not yet delivered
    if (order.status !== 'DELIVERED') {
        simulateOrderStatus(id, clientId, sendEvent);
    } else {
        // If already delivered, close the connection
        res.end();
    }

    // 5. Handle client disconnect
    req.on('close', () => {
        console.log(`Client ${clientId} disconnected`);
        delete clients[clientId]; // Clean up
        res.end();
    });
});

// This function simulates the order progression
async function simulateOrderStatus(orderId, clientId, sendEvent) {
    const db = getDb();
    const statuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

    let currentOrder = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
    let currentIndex = statuses.indexOf(currentOrder.status);

    // Function to advance to the next status
    const advanceStatus = async () => {
        // Stop if the client has disconnected
        if (!clients[clientId]) {
            console.log(`Simulation for order ${orderId} stopped: client disconnected.`);
            return;
        }

        currentIndex++;
        if (currentIndex < statuses.length) {
            const nextStatus = statuses[currentIndex];
            console.log(`Updating order ${orderId} to status: ${nextStatus}`);

            const updateData = {
                status: nextStatus,
                updatedAt: new Date()
            };

            // Add carrier info when it becomes 'SHIPPED'
            if (nextStatus === 'SHIPPED') {
                updateData.carrier = ['FedEx', 'UPS', 'DHL'][Math.floor(Math.random() * 3)];
                updateData.estimatedDelivery = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
            }

            // Update the database
            await db.collection('orders').updateOne(
                { _id: new ObjectId(orderId) },
                { $set: updateData }
            );

            // Fetch the updated order and send it to the client
            const updatedOrder = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
            sendEvent(updatedOrder);

            // If not yet delivered, schedule the next update
            if (nextStatus !== 'DELIVERED') {
                setTimeout(advanceStatus, 5000); // Wait 5 seconds
            } else {
                console.log(`Order ${orderId} is DELIVERED. Closing stream for client ${clientId}.`);
                if (clients[clientId]) clients[clientId].end(); // End the SSE connection
            }
        }
    };

    // Start the simulation after a short delay
    setTimeout(advanceStatus, 3000); // Wait 3 seconds before the first update
}

export default router;