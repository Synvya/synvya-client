/**
 * Routing utilities for application navigation
 * Basic routing constants and utilities
 */

/**
 * Application routes constants
 */
const ROUTES = {
    SIGNUP: '/signup',
    SIGNIN: '/signin',
    FORM: '/form',
    ORDERS: '/orders',
    VISUALIZATION: '/visualization'
};

/**
 * Routes that require authentication
 */
const PROTECTED_ROUTES = [
    ROUTES.FORM,
    ROUTES.ORDERS,
    ROUTES.VISUALIZATION
];

module.exports = {
    ROUTES,
    PROTECTED_ROUTES
}; 