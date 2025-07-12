/**
 * Shared Constants
 * Used by both Netlify and Lambda functions for consistent configuration
 */

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400'
};

module.exports = {
    CORS_HEADERS
}; 