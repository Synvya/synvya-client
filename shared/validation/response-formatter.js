/**
 * Standard CORS headers for all responses
 */
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

/**
 * Create a standardized success response
 * @param {Object} data - The response data
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Formatted response
 */
export function createSuccessResponse(data, statusCode = 200) {
    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify({
            success: true,
            ...data
        })
    };
}

/**
 * Create a standardized error response
 * @param {string} error - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {string} details - Additional error details (optional)
 * @returns {Object} Formatted response
 */
export function createErrorResponse(error, statusCode = 400, details = null) {
    const responseBody = {
        success: false,
        error
    };

    if (details) {
        responseBody.details = details;
    }

    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify(responseBody)
    };
}

/**
 * Create a CORS preflight response
 * @param {string} allowedMethods - Allowed HTTP methods (default: 'POST, OPTIONS')
 * @returns {Object} Formatted CORS response
 */
export function createCorsResponse(allowedMethods = 'POST, OPTIONS') {
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': allowedMethods,
            'Access-Control-Max-Age': '86400' // Cache preflight for 24 hours
        },
        body: ''
    };
}

/**
 * Create a method not allowed response
 * @param {string} allowedMethods - Allowed HTTP methods (default: 'POST')
 * @returns {Object} Formatted error response
 */
export function createMethodNotAllowedResponse(allowedMethods = 'POST') {
    return createErrorResponse('Method not allowed', 405);
}

/**
 * Create a validation error response
 * @param {string} validationError - The validation error message
 * @returns {Object} Formatted error response
 */
export function createValidationErrorResponse(validationError) {
    return createErrorResponse(validationError, 400);
}

/**
 * Create an internal server error response
 * @param {Error} error - The error object
 * @returns {Object} Formatted error response
 */
export function createInternalErrorResponse(error) {
    console.error('Internal server error:', error);
    return createErrorResponse(
        'Internal server error',
        500,
        error.message
    );
}

/**
 * Create a not found response
 * @param {string} message - Not found message (default: 'Resource not found')
 * @returns {Object} Formatted error response
 */
export function createNotFoundResponse(message = 'Resource not found') {
    return createErrorResponse(message, 404);
}

/**
 * Create a subscription validation response
 * @param {Object} validationResult - Result from subscription validation
 * @returns {Object} Formatted response
 */
export function createSubscriptionValidationResponse(validationResult) {
    return createSuccessResponse({
        isValid: validationResult.isValid,
        reason: validationResult.reason,
        subscription: validationResult.subscription,
        daysRemaining: validationResult.daysRemaining,
        validThrough: validationResult.subscription?.validThrough || null
    });
}

/**
 * Create an order creation response
 * @param {Object} orderData - Order data from Zaprite
 * @returns {Object} Formatted response
 */
export function createOrderResponse(orderData) {
    return createSuccessResponse({
        orderId: orderData.id,
        checkoutUrl: orderData.checkoutUrl,
        amount: orderData.totalAmount,
        currency: orderData.currency,
        status: orderData.status,
        contact: orderData.contact
    });
}

/**
 * Create a user orders response
 * @param {Array} orderIds - Array of order IDs
 * @returns {Object} Formatted response
 */
export function createUserOrdersResponse(orderIds) {
    return createSuccessResponse({
        orderIds: orderIds || [],
        totalOrders: (orderIds || []).length
    });
}

/**
 * Create a webhook processing response
 * @param {string} orderId - The processed order ID
 * @param {string} publicKey - The associated public key
 * @param {string} orderStatus - The order status
 * @param {string} newStatus - The new subscription status
 * @returns {Object} Formatted response
 */
export function createWebhookResponse(orderId, publicKey, orderStatus, newStatus) {
    return createSuccessResponse({
        message: 'Webhook processed successfully',
        orderId,
        publicKey,
        orderStatus,
        newStatus
    });
} 