const { formatLambdaSuccessResponse, formatLambdaErrorResponse, formatLambdaValidationErrorResponse } = require('./shared/validation/response-formatter.cjs');
const { validatePublicKey } = require('./shared/validation/request-validator.cjs');
const { getUserRecord } = require('./shared/services/user-records-service.cjs');

const handler = async (event) => {
    console.log('Check user exists function started - AWS Lambda');

    try {
        // Get public key from query parameters
        const publicKey = event.queryStringParameters?.publicKey;

        if (!publicKey) {
            return formatLambdaValidationErrorResponse('Public key is required');
        }

        console.log(`Checking if user exists: ${publicKey.substring(0, 8)}...`);

        // Validate public key format
        const isValidPublicKey = validatePublicKey(publicKey);
        if (!isValidPublicKey) {
            return formatLambdaValidationErrorResponse('Invalid public key format');
        }

        // Check if user record exists using the shared service
        const userRecord = await getUserRecord(publicKey);
        const userExists = userRecord !== null;

        console.log(`User exists: ${userExists}`);
        return formatLambdaSuccessResponse({ exists: userExists });

    } catch (error) {
        console.error('Error checking user existence:', error);
        return formatLambdaErrorResponse('Failed to check user existence');
    }
};

module.exports = { handler }; 