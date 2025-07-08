/**
 * TypeScript wrapper for shared routing utilities
 * Re-exports shared business logic with proper types
 */

interface SubscriptionValidation {
    isValid: boolean;
    reason: string;
    subscription: Record<string, unknown> | null;
    daysRemaining: number;
    validThrough?: string | null;
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
} as const;

/**
 * Determines the appropriate route for a user based on their subscription status
 * Uses the same business logic as the shared utilities
 */
export function getInitialRoute(subscription: SubscriptionValidation | null, currentPath: string = '/'): string | null {
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