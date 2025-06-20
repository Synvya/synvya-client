import { isSubscriptionValid, getSubscription } from '../../shared/services/subscription-service.js';

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

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { publicKey } = JSON.parse(event.body);

        if (!publicKey) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Public key is required' })
            };
        }

        console.log('Checking subscription validity for public key:', publicKey);

        // Check subscription validity
        const validationResult = await isSubscriptionValid(publicKey);

        console.log('Subscription validation result:', validationResult);

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({
                isValid: validationResult.isValid,
                reason: validationResult.reason,
                subscription: validationResult.subscription,
                daysRemaining: validationResult.daysRemaining,
                validThrough: validationResult.subscription?.validThrough || null
            })
        };

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                details: error.message
            })
        };
    }
}; 