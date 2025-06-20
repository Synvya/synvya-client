import { isSubscriptionValid, getSubscription } from '../../shared/services/subscription-service.js';

/**
 * AWS Lambda handler
 * This is the main function that AWS will call when someone visits your API
 */
export const handler = async (event, context) => {
    console.log('Lambda invoked with event:', JSON.stringify(event, null, 2));

    // Get HTTP method - Function URLs have different event structure
    const httpMethod = event.requestContext?.http?.method || event.httpMethod || 'GET';

    // Handle CORS preflight requests
    if (httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Max-Age': '86400' // Cache preflight for 24 hours
            },
            body: ''
        };
    }

    // Only allow POST requests  
    if (httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Parse request body
        let body;
        try {
            body = JSON.parse(event.body || '{}');
        } catch (parseError) {
            console.error('Error parsing request body:', parseError);
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                body: JSON.stringify({ error: 'Invalid JSON in request body' })
            };
        }

        const { publicKey } = body;
        console.log('Checking subscription for publicKey:', publicKey);

        if (!publicKey) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
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