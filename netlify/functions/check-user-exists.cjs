/**
 * Check if a user already exists in the system
 * Used to determine if user should sign up or sign in
 */

const { validatePublicKey } = require('../../shared/validation/request-validator.cjs');
const { formatSuccessResponse, formatErrorResponse } = require('../../shared/validation/response-formatter.cjs');
const { getUserRecord } = require('../../shared/services/user-records-service.cjs');

const handler = async (event, context) => {
    console.log('Check user exists function started - Netlify');

    try {
        // Only allow GET requests
        if (event.httpMethod !== 'GET') {
            return formatErrorResponse('Method not allowed', 405);
        }

        // Get public key from query parameters
        const publicKey = event.queryStringParameters?.publicKey;

        if (!publicKey) {
            return formatErrorResponse('Missing public key parameter', 400);
        }

        // Validate public key format
        if (!validatePublicKey(publicKey)) {
            return formatErrorResponse('Invalid public key format', 400);
        }

        console.log('Checking if user exists:', publicKey.slice(0, 8) + '...');

        // Check if user exists in records
        const userRecord = await getUserRecord(publicKey);
        const exists = userRecord !== null;

        console.log('User exists:', exists);

        return formatSuccessResponse({
            exists,
            publicKey: publicKey.slice(0, 8) + '...',
            ...(exists && userRecord && {
                acceptedAt: userRecord.acceptedAt,
                termsVersion: userRecord.termsVersion
            })
        });

    } catch (error) {
        console.error('Error checking user exists:', error);
        return formatErrorResponse('Internal server error', 500);
    }
};

module.exports = { handler }; 