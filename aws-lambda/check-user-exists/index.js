const { formatSuccessResponse, formatErrorResponse, formatValidationErrorResponse } = require('../../shared/validation/response-formatter.cjs');
const { validatePublicKey } = require('../../shared/validation/request-validator.cjs');
const { getUserRecord } = require('../../shared/services/user-records-service.cjs');

const handler = async (event) => {
    console.log('Check user exists function started - AWS Lambda');

    // Handle CORS preflight requests
    if (event.requestContext?.http?.method === 'OPTIONS') {
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

    try {
        // Get public key from query parameters
        const publicKey = event.queryStringParameters?.publicKey;

        if (!publicKey) {
            return formatValidationErrorResponse('Public key is required');
        }

        console.log(`Checking if user exists: ${publicKey.substring(0, 8)}...`);

        // Validate public key format
        const isValidPublicKey = validatePublicKey(publicKey);
        if (!isValidPublicKey) {
            return formatValidationErrorResponse('Invalid public key format');
        }

        // Check if user record exists using the shared service
        const userRecord = await getUserRecord(publicKey);
        const userExists = userRecord !== null;

        console.log(`User exists: ${userExists}`);
        return formatSuccessResponse({ exists: userExists });

    } catch (error) {
        console.error('Error checking user existence:', error);
        return formatErrorResponse('Failed to check user existence');
    }
};

module.exports = { handler }; 