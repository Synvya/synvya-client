import { getSubscription } from './lib/subscription-db.js';

export const handler = async (event, context) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    // Only allow POST requests (to send public key securely)
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Parse request body
        const { publicKey } = JSON.parse(event.body);

        if (!publicKey) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Public key is required' })
            };
        }

        console.log('Getting orders for public key:', publicKey);

        // Get subscription data
        const subscription = await getSubscription(publicKey);

        if (!subscription) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    error: 'No subscription found',
                    orderIds: []
                })
            };
        }

        // Get the order IDs array
        const orderIds = subscription.orderIds || [];

        console.log('Found order IDs:', orderIds);

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({
                success: true,
                orderIds: orderIds,
                totalOrders: orderIds.length
            })
        };

    } catch (error) {
        console.error('Get user orders error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                details: error.message
            })
        };
    }
}; 