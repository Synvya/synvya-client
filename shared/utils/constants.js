/**
 * Shared Constants
 * Used by both Netlify and Lambda functions for consistent configuration
 */

export const PLAN_DETAILS = {
    monthly: {
        amount: 999, // $9.99 in cents
        currency: 'USD',
        label: 'Monthly Subscription'
    },
    annual: {
        amount: 9999, // $99.99 in cents
        currency: 'USD',
        label: 'Annual Subscription'
    }
};

export const DEFAULT_EMAIL = 'wedonotcollect@youremail.com';

export const ZAPRITE_ORDER_STATUS = {
    PENDING: 'PENDING',
    COMPLETE: 'COMPLETE',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED'
};

export const SUBSCRIPTION_STATUS = {
    ACTIVE: 'active',
    PENDING: 'pending',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled'
};

export const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400'
}; 