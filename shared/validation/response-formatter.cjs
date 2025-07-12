/**
 * Shared Response Formatting
 * Provides consistent response formatting across functions
 */

const { CORS_HEADERS } = require('../utils/constants.cjs');

/**
 * Format success response
 * @param {Object} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Formatted response
 */
function formatSuccessResponse(data, statusCode = 200) {
    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify(data)
    };
}

/**
 * Format error response
 * @param {string} error - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {string} details - Additional error details
 * @returns {Object} Formatted response
 */
function formatErrorResponse(error, statusCode = 500, details = null) {
    const responseBody = { error };
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
 * Format validation error response
 * @param {string} error - Validation error message
 * @param {Object} validationDetails - Details about validation failures
 * @returns {Object} Formatted response
 */
function formatValidationErrorResponse(error, validationDetails = null) {
    const responseBody = { error };
    if (validationDetails) {
        responseBody.validation = validationDetails;
    }

    return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify(responseBody)
    };
}

/**
 * Format CORS preflight response
 * @returns {Object} Formatted CORS response
 */
function formatCorsResponse() {
    return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: ''
    };
}

// Lambda-specific formatters (no CORS headers - Function URL handles CORS)
function formatLambdaSuccessResponse(data, statusCode = 200) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };
}

function formatLambdaErrorResponse(error, statusCode = 500, details = null) {
    const responseBody = { error };
    if (details) {
        responseBody.details = details;
    }

    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(responseBody)
    };
}

function formatLambdaValidationErrorResponse(error, validationDetails = null) {
    const responseBody = { error };
    if (validationDetails) {
        responseBody.validation = validationDetails;
    }

    return {
        statusCode: 400,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(responseBody)
    };
}

module.exports = {
    formatSuccessResponse,
    formatErrorResponse,
    formatValidationErrorResponse,
    formatCorsResponse,
    formatLambdaSuccessResponse,
    formatLambdaErrorResponse,
    formatLambdaValidationErrorResponse
}; 