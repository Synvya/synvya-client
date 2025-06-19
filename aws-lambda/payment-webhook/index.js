import { getSubscription, updateSubscription } from './lib/subscription-db.js';

export const handler = async (event, context) => {
    // CORS is handled by Function URL configuration
    if (event.requestContext.http.method === 'OPTIONS') {
        return {
            statusCode: 200,
            body: ''
        };
    }

    // Only allow POST requests
    if (event.requestContext.http.method !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        console.log('Webhook received:', JSON.stringify(body, null, 2));

        // Validate webhook data
        if (!body.eventType || !body.orderId) {
            console.log('Invalid webhook data - missing eventType or orderId');
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid webhook data' })
            };
        }

        // Only process COMPLETE orders
        if (body.eventType !== 'order.status.complete') {
            console.log('Ignoring non-complete order event:', body.eventType);
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Event ignored' })
            };
        }

        const orderId = body.orderId;
        console.log('Processing completed order:', orderId);

        // Find the subscription with this orderId
        const subscriptions = await getAllSubscriptions();
        let targetPublicKey = null;
        let subscription = null;

        for (const [publicKey, sub] of Object.entries(subscriptions)) {
            if (sub.orderId === orderId) {
                targetPublicKey = publicKey;
                subscription = sub;
                break;
            }
        }

        if (!targetPublicKey || !subscription) {
            console.log('No subscription found for order:', orderId);
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Subscription not found' })
            };
        }

        console.log('Found subscription for publicKey:', targetPublicKey);

        // Update subscription status to active
        const updatedSubscription = {
            ...subscription,
            status: 'active'
        };

        // Add order ID to order history if not already present
        if (!updatedSubscription.orderIds) {
            updatedSubscription.orderIds = [];
        }

        if (!updatedSubscription.orderIds.includes(orderId)) {
            updatedSubscription.orderIds.push(orderId);
            console.log('Added order to history:', orderId);
        }

        // Save updated subscription
        await updateSubscription(targetPublicKey, updatedSubscription);
        console.log('Subscription updated successfully');

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Webhook processed successfully',
                publicKey: targetPublicKey,
                orderId: orderId
            })
        };

    } catch (error) {
        console.error('Webhook processing error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

// Helper function to get all subscriptions (we need to import this)
async function getAllSubscriptions() {
    const { getAllSubscriptions: getAll } = await import('./lib/subscription-db.js');
    return await getAll();
} 