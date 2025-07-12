const handler = async (event, context) => {
    console.log('Health check function called with event:', JSON.stringify(event, null, 2));

    try {
        // Handle CORS preflight
        if (event.requestContext?.http?.method === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Max-Age': '86400'
                },
                body: ''
            };
        }

        // Return health status
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            body: JSON.stringify({
                status: 'healthy',
                service: 'synvya-health-check',
                timestamp: new Date().toISOString(),
                environment: 'aws-lambda',
                version: '1.0'
            })
        };
    } catch (error) {
        console.error('Health check error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                status: 'error',
                message: error.message,
                service: 'synvya-health-check'
            })
        };
    }
};

module.exports = { handler }; 