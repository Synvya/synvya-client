import { getSubscription } from './lib/subscription-db.js';

export const handler = async (event, context) => {
    // CORS is handled by Function URL configuration
    if (event.requestContext.http.method === 'OPTIONS') {
        return {
            statusCode: 200,
            body: ''
        };
    }

    // Only allow GET requests
    if (event.requestContext.http.method !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const publicKey = event.queryStringParameters?.publicKey;

        if (!publicKey) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Public key is required' })
            };
        }

        console.log('Fetching order IDs for publicKey:', publicKey);

        // Get subscription data for the user
        const subscription = await getSubscription(publicKey);

        if (!subscription) {
            console.log('No subscription found for publicKey:', publicKey);
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'No subscription found' })
            };
        }

        // Return order IDs array (empty array if no orders)
        const orderIds = subscription.orderIds || [];
        console.log('Found order IDs:', orderIds);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ orderIds })
        };

    } catch (error) {
        console.error('Error fetching user orders:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
}; 