import { updateSubscription, getSubscription } from '../../shared/services/subscription-service.js';

export const handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const webhookData = JSON.parse(event.body);

        console.log('Received webhook:', JSON.stringify(webhookData, null, 2));

        // Validate webhook - Zaprite sends minimal data with orderId
        if (!webhookData.orderId) {
            console.log('Invalid webhook data - missing orderId');
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid webhook data - missing orderId' })
            };
        }

        const orderId = webhookData.orderId;
        console.log(`Processing webhook for order: ${orderId}`);

        // Get Zaprite API key
        const apiKey = process.env.ZAPRITE_API_KEY;
        if (!apiKey) {
            console.error('ZAPRITE_API_KEY not found');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'API key not configured' })
            };
        }

        // Step 1: Fetch order details from Zaprite
        console.log(`Fetching order details for: ${orderId}`);

        const orderResponse = await fetch(`https://api.zaprite.com/v1/order/${orderId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            }
        });

        if (!orderResponse.ok) {
            const errorText = await orderResponse.text();
            console.error('Failed to fetch order from Zaprite:', orderResponse.status, errorText);
            return {
                statusCode: orderResponse.status,
                body: JSON.stringify({
                    error: `Failed to fetch order: ${orderResponse.status}`,
                    details: errorText
                })
            };
        }

        const orderData = await orderResponse.json();
        console.log('Order data retrieved:', JSON.stringify(orderData, null, 2));

        // Extract order information
        const orderStatus = orderData.status;
        const publicKey = orderData.metadata?.['public-key'];

        if (!publicKey) {
            console.log('No public key found in order metadata');
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'No public key in order metadata' })
            };
        }

        console.log(`Order ${orderId} has status: ${orderStatus}, public key: ${publicKey}`);

        // Get existing subscription
        const existingSubscription = await getSubscription(publicKey);

        if (!existingSubscription) {
            console.log('No existing subscription found for public key:', publicKey);
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Subscription not found' })
            };
        }

        // Update subscription status based on payment status
        let newStatus;
        switch (orderStatus) {
            case 'PAID':
            case 'COMPLETED':
            case 'COMPLETE':
                newStatus = 'active';
                break;
            case 'CANCELLED':
            case 'EXPIRED':
                newStatus = 'cancelled';
                break;
            case 'PENDING':
                newStatus = 'pending';
                break;
            default:
                console.log(`Unknown order status: ${orderStatus}, keeping existing status`);
                newStatus = existingSubscription.status;
        }

        // Initialize orderIds array if it doesn't exist
        const orderIds = existingSubscription.orderIds || [];

        // Add orderId to the array if it's a COMPLETE order and not already in the array
        if (orderStatus === 'COMPLETE' && !orderIds.includes(orderId)) {
            orderIds.push(orderId);
            console.log(`Added order ${orderId} to order history for public key: ${publicKey}`);
        }

        // Update subscription with new status and order history
        await updateSubscription(publicKey, {
            ...existingSubscription,
            status: newStatus,
            orderIds: orderIds,
            lastPaymentStatus: orderStatus,
            lastWebhookReceived: new Date().toISOString()
        });

        console.log(`Subscription status updated to ${newStatus} for public key: ${publicKey}`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Webhook processed successfully',
                orderId: orderId,
                publicKey: publicKey,
                orderStatus: orderStatus,
                newStatus: newStatus
            })
        };

    } catch (error) {
        console.error('Webhook processing error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                details: error.message
            })
        };
    }
}; 