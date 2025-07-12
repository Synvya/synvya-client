/**
 * Health Check Function - AWS Lambda Version
 * Simple endpoint to verify the serverless function environment is working
 * Maintains local/cloud development parity structure
 * Uses same business logic as Netlify version
 */

export const handler = async (event, context) => {
    console.log('Health check function started - event:', JSON.stringify(event, null, 2));

    const method = event.requestContext.http.method;
    console.log('Request method:', method);

    // Handle CORS preflight OPTIONS request
    if (method === 'OPTIONS') {
        console.log('Handling CORS preflight OPTIONS request');
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Max-Age': '86400'
            },
            body: ''
        };
    }

    // Only allow GET requests
    if (method !== 'GET') {
        console.log('Method not allowed:', method);
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET'
            },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const response = {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET'
            },
            body: JSON.stringify({
                status: 'healthy',
                environment: process.env.NODE_ENV || 'production',
                timestamp: new Date().toISOString(),
                message: 'Synvya serverless functions are operational',
                runtime: 'aws-lambda'
            })
        };

        console.log('Health check successful, returning response');
        return response;

    } catch (error) {
        console.error('Health check error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET'
            },
            body: JSON.stringify({
                status: 'error',
                error: 'Internal server error',
                runtime: 'aws-lambda'
            })
        };
    }
}; 