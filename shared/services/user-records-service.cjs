/**
 * User Records Service
 * Handles user signup and terms acceptance records with local/cloud parity
 */

const fs = require('fs/promises');
const path = require('path');

// Configuration for different environments
const CONFIG = {
    local: {
        recordsPath: path.join(process.cwd(), 'netlify', 'functions', 'data', 'user-records.json')
    },
    cloud: {
        bucketName: process.env.USER_RECORDS_BUCKET || 'synvya-user-records-prod-v2',
        recordsKey: 'user-records.json'
    }
};

// Environment detection - check for local development
const isLocal = process.env.NETLIFY_DEV === 'true' ||
    process.env.NODE_ENV === 'development' ||
    !process.env.AWS_LAMBDA_FUNCTION_NAME;

console.log('Environment detection:', {
    isLocal,
    NETLIFY_DEV: process.env.NETLIFY_DEV,
    NODE_ENV: process.env.NODE_ENV,
    AWS_LAMBDA_FUNCTION_NAME: !!process.env.AWS_LAMBDA_FUNCTION_NAME
});

/**
 * Get user record by public key
 * @param {string} publicKey - User's public key
 * @returns {Object|null} User record or null if not found
 */
async function getUserRecord(publicKey) {
    try {
        if (isLocal) {
            // Local development - read from JSON file
            console.log('Using local file storage:', CONFIG.local.recordsPath);
            const recordsData = await fs.readFile(CONFIG.local.recordsPath, 'utf8');
            const records = JSON.parse(recordsData);

            return records.users[publicKey] || null;
        } else {
            // Cloud environment - read from S3
            console.log('Using cloud S3 storage');
            const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
            const s3Client = new S3Client({ region: 'us-east-1' });

            const command = new GetObjectCommand({
                Bucket: CONFIG.cloud.bucketName,
                Key: CONFIG.cloud.recordsKey
            });

            const response = await s3Client.send(command);
            const recordsData = await response.Body.transformToString();
            const records = JSON.parse(recordsData);

            return records.users[publicKey] || null;
        }
    } catch (error) {
        if (error.code === 'ENOENT' || error.name === 'NoSuchKey') {
            // File/object doesn't exist, return null
            console.log('No existing user records found');
            return null;
        }
        console.error('Error reading user records:', error);
        throw error;
    }
}

/**
 * Save user record to storage
 * @param {string} publicKey - User's public key
 * @param {Object} recordData - User record data
 */
async function saveUserRecord(publicKey, recordData) {
    try {
        if (isLocal) {
            // Local development - read, update, write JSON file
            console.log('Saving to local file storage');
            let records = { users: {}, metadata: { version: '1.0', created: new Date().toISOString(), description: 'User signup and terms acceptance records for legal compliance', totalUsers: 0 } };

            try {
                const recordsData = await fs.readFile(CONFIG.local.recordsPath, 'utf8');
                records = JSON.parse(recordsData);
            } catch (error) {
                if (error.code !== 'ENOENT') throw error;
                // File doesn't exist, use default structure
                console.log('Creating new user records file');
            }

            // Add or update user record
            records.users[publicKey] = recordData;
            records.metadata.totalUsers = Object.keys(records.users).length;
            records.metadata.lastUpdated = new Date().toISOString();

            // Ensure directory exists
            const dir = path.dirname(CONFIG.local.recordsPath);
            await fs.mkdir(dir, { recursive: true });

            // Write updated records
            await fs.writeFile(CONFIG.local.recordsPath, JSON.stringify(records, null, 2));

        } else {
            // Cloud environment - read from S3, update, write back
            console.log('Saving to cloud S3 storage');
            const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
            const s3Client = new S3Client({ region: 'us-east-1' });

            let records = { users: {}, metadata: { version: '1.0', created: new Date().toISOString(), description: 'User signup and terms acceptance records for legal compliance', totalUsers: 0 } };

            try {
                const getCommand = new GetObjectCommand({
                    Bucket: CONFIG.cloud.bucketName,
                    Key: CONFIG.cloud.recordsKey
                });

                const response = await s3Client.send(getCommand);
                const recordsData = await response.Body.transformToString();
                records = JSON.parse(recordsData);
            } catch (error) {
                if (error.name !== 'NoSuchKey') throw error;
                // File doesn't exist, use default structure
            }

            // Add or update user record
            records.users[publicKey] = recordData;
            records.metadata.totalUsers = Object.keys(records.users).length;
            records.metadata.lastUpdated = new Date().toISOString();

            // Write updated records back to S3
            const putCommand = new PutObjectCommand({
                Bucket: CONFIG.cloud.bucketName,
                Key: CONFIG.cloud.recordsKey,
                Body: JSON.stringify(records, null, 2),
                ContentType: 'application/json',
                ServerSideEncryption: 'AES256'
            });

            await s3Client.send(putCommand);
        }

        console.log('User records saved successfully');

    } catch (error) {
        console.error('Error saving user record:', error);
        throw error;
    }
}

module.exports = {
    getUserRecord,
    saveUserRecord
}; 