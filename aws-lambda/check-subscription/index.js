import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

// Configuration
const S3_BUCKET = process.env.SUBSCRIPTION_DB_BUCKET || 'synvya-subscriptions-prod';
const S3_KEY = 'subscriptions.json';

// Initialize S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1'
});

/**
 * Load subscription data from S3
 * @returns {Object} Subscription data object
 */
async function loadSubscriptionData() {
    try {
        console.log('Loading subscription data from S3:', S3_BUCKET, S3_KEY);
        const command = new GetObjectCommand({
            Bucket: S3_BUCKET,
            Key: S3_KEY,
        });

        try {
            const response = await s3Client.send(command);
            const data = await response.Body.transformToString();
            return JSON.parse(data);
        } catch (error) {
            if (error.name === 'NoSuchKey') {
                console.log('S3 subscription database not found, creating new one');
                return { contacts: {} };
            }
            throw error;
        }
    } catch (error) {
        console.error('Error loading subscription data:', error);
        throw new Error(`Failed to load subscription data: ${error.message}`);
    }
}

/**
 * Get subscription info for a public key
 * @param {string} publicKey - The public key to look up
 * @returns {Object|null} Subscription data or null if not found
 */
async function getSubscription(publicKey) {
    try {
        const data = await loadSubscriptionData();
        return data.contacts[publicKey] || null;
    } catch (error) {
        console.error('Error getting subscription:', error);
        throw error;
    }
}

/**
 * Check if a subscription is currently valid
 * @param {string} publicKey - The public key to check
 * @returns {Object} Validation result
 */
async function isSubscriptionValid(publicKey) {
    try {
        const subscription = await getSubscription(publicKey);

        if (!subscription) {
            return {
                isValid: false,
                reason: 'No subscription found',
                subscription: null
            };
        }

        // Parse the valid-through date (DD-MM-YYYY format)
        const [day, month, year] = subscription.validThrough.split('-').map(Number);
        const validThroughDate = new Date(year, month - 1, day); // month is 0-indexed
        const currentDate = new Date();

        // Set time to end of day for valid-through date to be inclusive
        validThroughDate.setHours(23, 59, 59, 999);

        const isValid = currentDate <= validThroughDate;

        return {
            isValid,
            reason: isValid ? 'Valid subscription' : 'Subscription expired',
            subscription,
            validThrough: validThroughDate,
            daysRemaining: isValid ? Math.ceil((validThroughDate - currentDate) / (1000 * 60 * 60 * 24)) : 0
        };
    } catch (error) {
        console.error('Error checking subscription validity:', error);
        throw error;
    }
}

/**
 * AWS Lambda handler
 * This is the main function that AWS will call when someone visits your API
 */
export const handler = async (event, context) => {
    console.log('Event:', JSON.stringify(event, null, 2));

    // Handle CORS preflight - this allows web browsers to call your API
    if (event.requestContext?.http?.method === 'OPTIONS') {
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
    if (event.requestContext?.http?.method !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { publicKey } = JSON.parse(event.body);

        if (!publicKey) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
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
                'Content-Type': 'application/json'
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
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                details: error.message
            })
        };
    }
}; 