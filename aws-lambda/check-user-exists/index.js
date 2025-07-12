const { GetObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { formatSuccessResponse, formatErrorResponse, formatValidationErrorResponse } = require('../../shared/validation/response-formatter.cjs');
const { validatePublicKey } = require('../../shared/validation/request-validator.cjs');

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

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

        // Check if user record exists in S3
        const bucketName = process.env.USER_RECORDS_BUCKET;
        const key = `users/${publicKey}.json`;

        try {
            await s3Client.send(new GetObjectCommand({
                Bucket: bucketName,
                Key: key
            }));

            console.log(`User exists: true`);
            return formatSuccessResponse({ exists: true });
        } catch (error) {
            if (error.name === 'NoSuchKey') {
                console.log(`User exists: false`);
                return formatSuccessResponse({ exists: false });
            }
            throw error; // Re-throw other S3 errors
        }

    } catch (error) {
        console.error('Error checking user existence:', error);
        return formatErrorResponse('Failed to check user existence');
    }
};

module.exports = { handler }; 