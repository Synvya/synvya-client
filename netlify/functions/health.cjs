/**
 * Health Check Function
 * Simple endpoint to verify the serverless function environment is working
 * Maintains local/cloud development parity structure
 */

const handler = async (event, context) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
            },
            body: ''
        };
    }

    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                status: 'healthy',
                environment: process.env.NODE_ENV || 'development',
                timestamp: new Date().toISOString(),
                message: 'Synvya serverless functions are operational'
            })
        };
    } catch (error) {
        console.error('Health check error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                status: 'error',
                error: 'Internal server error'
            })
        };
    }
};

module.exports = { handler }; 