/**
 * Validate public key format
 * @param {string} publicKey - The public key to validate
 * @returns {boolean} True if valid
 */
export function isValidPublicKey(publicKey) {
    if (!publicKey || typeof publicKey !== 'string') {
        return false;
    }

    // Nostr public keys should be 64 character hex strings
    return /^[a-fA-F0-9]{64}$/.test(publicKey);
}

/**
 * Validate plan type
 * @param {string} planType - The plan type to validate
 * @returns {boolean} True if valid
 */
export function isValidPlanType(planType) {
    return ['monthly', 'annual'].includes(planType);
}

/**
 * Validate email format (basic validation)
 * @param {string} email - The email to validate
 * @returns {boolean} True if valid
 */
export function isValidEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate order ID format
 * @param {string} orderId - The order ID to validate
 * @returns {boolean} True if valid
 */
export function isValidOrderId(orderId) {
    if (!orderId || typeof orderId !== 'string') {
        return false;
    }

    // Zaprite order IDs start with "od_"
    return orderId.startsWith('od_') && orderId.length > 3;
}

/**
 * Validate contact ID format
 * @param {string} contactId - The contact ID to validate
 * @returns {boolean} True if valid
 */
export function isValidContactId(contactId) {
    if (!contactId || typeof contactId !== 'string') {
        return false;
    }

    // Zaprite contact IDs start with "cmc"
    return contactId.startsWith('cmc') && contactId.length > 3;
}

/**
 * Validate request body for subscription check
 * @param {Object} body - The request body
 * @returns {Object} Validation result
 */
export function validateSubscriptionCheckRequest(body) {
    if (!body || typeof body !== 'object') {
        return {
            isValid: false,
            error: 'Request body is required'
        };
    }

    const { publicKey } = body;

    if (!publicKey) {
        return {
            isValid: false,
            error: 'Public key is required'
        };
    }

    if (!isValidPublicKey(publicKey)) {
        return {
            isValid: false,
            error: 'Invalid public key format'
        };
    }

    return { isValid: true };
}

/**
 * Validate request body for order creation
 * @param {Object} body - The request body
 * @returns {Object} Validation result
 */
export function validateOrderCreationRequest(body) {
    if (!body || typeof body !== 'object') {
        return {
            isValid: false,
            error: 'Request body is required'
        };
    }

    const { publicKey, planType } = body;

    if (!publicKey) {
        return {
            isValid: false,
            error: 'Public key is required'
        };
    }

    if (!isValidPublicKey(publicKey)) {
        return {
            isValid: false,
            error: 'Invalid public key format'
        };
    }

    if (!planType) {
        return {
            isValid: false,
            error: 'Plan type is required'
        };
    }

    if (!isValidPlanType(planType)) {
        return {
            isValid: false,
            error: 'Valid plan type is required (monthly or annual)'
        };
    }

    return { isValid: true };
} 