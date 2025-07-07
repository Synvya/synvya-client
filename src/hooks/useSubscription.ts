import { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '@/utils/apiConfig';

interface SubscriptionData {
    contactId: string;
    validThrough: string;
    planType: 'monthly' | 'annual';
    email: string;
    orderId: string;
    status: 'pending' | 'active' | 'cancelled';
    lastUpdated: string;
}

interface SubscriptionValidation {
    isValid: boolean;
    reason: string;
    subscription: SubscriptionData | null;
    daysRemaining: number;
    validThrough: string | null;
}

interface UseSubscriptionReturn {
    subscription: SubscriptionValidation | null;
    isLoading: boolean;
    error: string | null;
    checkSubscription: (publicKey: string) => Promise<void>;
    refreshSubscription: () => Promise<void>;
}

export const useSubscription = (publicKey?: string): UseSubscriptionReturn => {
    const [subscription, setSubscription] = useState<SubscriptionValidation | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkSubscription = useCallback(async (key: string) => {
        if (!key) {
            setError('Public key is required');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const endpoint = getApiUrl('checkSubscription');

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ publicKey: key })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const result = await response.json();
            setSubscription(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to check subscription';
            setError(errorMessage);
            console.error('Subscription check error:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refreshSubscription = useCallback(async () => {
        if (publicKey) {
            await checkSubscription(publicKey);
        }
    }, [publicKey, checkSubscription]);

    // Auto-check subscription when public key changes
    useEffect(() => {
        if (publicKey) {
            checkSubscription(publicKey);
        }
    }, [publicKey, checkSubscription]);

    return {
        subscription,
        isLoading,
        error,
        checkSubscription,
        refreshSubscription,
    };
};

// Helper function to check if user has valid subscription
export const hasValidSubscription = (subscription: SubscriptionValidation | null): boolean => {
    return subscription?.isValid === true;
};

// Helper function to get subscription status message
export const getSubscriptionStatusMessage = (subscription: SubscriptionValidation | null): string => {
    if (!subscription) {
        return 'Subscription status unknown';
    }

    if (!subscription.subscription) {
        return 'No subscription found';
    }

    const { isValid, reason, subscription: subData, daysRemaining } = subscription;

    if (isValid) {
        return `Active subscription (${daysRemaining} days remaining)`;
    }

    if (!isValid) {
        return `Subscription expired (${reason})`;
    }

    return reason;
}; 