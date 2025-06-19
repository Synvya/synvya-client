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
                console.log('Subscription file does not exist, creating empty structure');
                return { contacts: {} };
            }
            throw error;
        }
    } catch (error) {
        console.error('Error loading subscription data:', error);
        throw error;
    }
}

/**
 * Save subscription data to S3
 */
async function saveSubscriptionData(data) {
    try {
        console.log('Saving subscription data to S3:', S3_BUCKET, S3_KEY);
        const command = new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: S3_KEY,
            Body: JSON.stringify(data, null, 2),
            ContentType: 'application/json',
            ServerSideEncryption: 'AES256'
        });

        await s3Client.send(command);
        console.log('Subscription data saved successfully');
    } catch (error) {
        console.error('Error saving subscription data:', error);
        throw error;
    }
}

/**
 * Update subscription for a specific public key
 */
export async function updateSubscription(publicKey, subscriptionData) {
    const data = await loadSubscriptionData();

    if (!data.contacts) {
        data.contacts = {};
    }

    data.contacts[publicKey] = subscriptionData;
    await saveSubscriptionData(data);
}

/**
 * Get subscription for a specific public key
 */
export async function getSubscription(publicKey) {
    const data = await loadSubscriptionData();
    return data.contacts?.[publicKey] || null;
}

/**
 * Get all subscriptions
 */
export async function getAllSubscriptions() {
    const data = await loadSubscriptionData();
    return data.contacts || {};
} 