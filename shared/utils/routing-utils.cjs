/**
 * Routing utilities for application navigation
 * Basic routing constants and utilities
 */

/**
 * Application routes constants
 */
export const ROUTES = {
    SIGNUP: '/signup',
    SIGNIN: '/signin',
    FORM: '/form',
    ORDERS: '/orders',
    VISUALIZATION: '/visualization'
};

/**
 * Routes that require authentication
 */
export const PROTECTED_ROUTES = [
    ROUTES.FORM,
    ROUTES.ORDERS,
    ROUTES.VISUALIZATION
]; 