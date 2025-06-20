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
 * Get subscription info for a public key
 * @param {string} publicKey - The public key to look up
 * @returns {Object|null} Subscription data or null if not found
 */
export async function getSubscription(publicKey) {
    try {
        const data = await loadSubscriptionData();
        return data.contacts?.[publicKey] || null;
    } catch (error) {
        console.error('Error getting subscription:', error);
        throw error;
    }
}

/**
 * Update subscription info for a public key
 * @param {string} publicKey - The public key
 * @param {Object} subscriptionInfo - Subscription information
 * @param {string} subscriptionInfo.contactId - Zaprite contact ID
 * @param {string} subscriptionInfo.validThrough - Valid through date (DD-MM-YYYY)
 * @param {string} subscriptionInfo.planType - Plan type (monthly/annual)
 * @param {string} subscriptionInfo.email - User email
 * @param {string} subscriptionInfo.orderId - Zaprite order ID
 */
export async function updateSubscription(publicKey, subscriptionInfo) {
    try {
        const data = await loadSubscriptionData();

        if (!data.contacts) {
            data.contacts = {};
        }

        data.contacts[publicKey] = {
            ...subscriptionInfo,
            lastUpdated: new Date().toISOString(),
        };

        await saveSubscriptionData(data);

        console.log(`Subscription updated for public key: ${publicKey}`);
        return data.contacts[publicKey];
    } catch (error) {
        console.error('Error updating subscription:', error);
        throw error;
    }
}

/**
 * Check if a subscription is currently valid
 * @param {string} publicKey - The public key to check
 * @returns {Object} Validation result
 */
export async function isSubscriptionValid(publicKey) {
    try {
        const subscription = await getSubscription(publicKey);

        if (!subscription) {
            return {
                isValid: false,
                reason: 'No subscription found',
                subscription: null,
                daysRemaining: 0
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
 * Get all subscriptions (for admin purposes)
 * @returns {Object} All subscription data
 */
export async function getAllSubscriptions() {
    try {
        const data = await loadSubscriptionData();
        return data.contacts || {};
    } catch (error) {
        console.error('Error getting all subscriptions:', error);
        throw error;
    }
}

/**
 * Remove subscription for a public key
 * @param {string} publicKey - The public key to remove
 */
export async function removeSubscription(publicKey) {
    try {
        const data = await loadSubscriptionData();

        if (data.contacts && data.contacts[publicKey]) {
            delete data.contacts[publicKey];
            await saveSubscriptionData(data);
            console.log(`Subscription removed for public key: ${publicKey}`);
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error removing subscription:', error);
        throw error;
    }
} 