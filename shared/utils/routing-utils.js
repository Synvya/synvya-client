/**
 * Routing utilities for subscription-based navigation
 * Handles business logic for where users should be directed based on subscription status
 */

/**
 * Determines the appropriate route for a user based on their subscription status
 * @param {Object} subscription - Subscription validation result from useSubscription hook
 * @param {boolean} subscription.isValid - Whether the subscription is valid
 * @param {string} currentPath - Current path the user is on
 * @returns {string|null} Route to redirect to, or null if no redirect needed
 */
export function getInitialRoute(subscription, currentPath = '/') {
    // If we don't have subscription data yet, don't redirect
    if (!subscription) {
        return null;
    }

    // If user has valid subscription and is on signup page, redirect to signin
    if (subscription.isValid && currentPath === '/signup') {
        return '/signin';
    }

    // If user has no valid subscription and is on signin page, they can stay (might be trying to sign in)
    // The SubscriptionGuard will handle protecting the actual protected routes

    // No redirect needed
    return null;
}

/**
 * Determines if a user should be redirected from the root path
 * @param {Object} subscription - Subscription validation result from useSubscription hook
 * @param {boolean} subscription.isValid - Whether the subscription is valid
 * @returns {string} Route to redirect to from root path
 */
export function getRootRedirectRoute(subscription) {
    // Default to signup for all users
    // Existing subscribers will be redirected to signin from the signup page
    return '/signup';
}

/**
 * Business logic constants for routing
 */
export const ROUTES = {
    SIGNUP: '/signup',
    SIGNIN: '/signin',
    FORM: '/form',
    PAYMENT: '/payment',
    ORDERS: '/orders'
};

/**
 * Routes that require valid subscription
 */
export const PROTECTED_ROUTES = [
    ROUTES.FORM,
    ROUTES.ORDERS,
    '/visualization'
];

/**
 * Routes that require authentication but not subscription
 */
export const AUTH_REQUIRED_ROUTES = [
    ROUTES.PAYMENT
]; 