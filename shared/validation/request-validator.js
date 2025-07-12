/**
 * Shared Request Validation
 * Validates incoming requests for consistency across functions
 */

/**
 * Validate public key format
 * @param {string} publicKey - Public key to validate
 * @returns {boolean} True if valid
 */
export function validatePublicKey(publicKey) {
    if (!publicKey || typeof publicKey !== 'string') {
        return false;
    }
    // Nostr public keys are 64-character hex strings
    return /^[0-9a-fA-F]{64}$/.test(publicKey);
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate required fields in request body
 * @param {Object} body - Request body
 * @param {string[]} requiredFields - Array of required field names
 * @returns {Object} Validation result
 */
export function validateRequiredFields(body, requiredFields) {
    const missing = [];

    for (const field of requiredFields) {
        if (!body[field]) {
            missing.push(field);
        }
    }

    return {
        isValid: missing.length === 0,
        missing
    };
} 