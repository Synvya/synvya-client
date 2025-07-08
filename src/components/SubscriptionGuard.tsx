import React, { useEffect, useState, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useNostrAuth } from '@/contexts/NostrAuthContext';
import { getApiUrl } from '@/utils/apiConfig';

interface SubscriptionGuardProps {
    children: React.ReactNode;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
    const location = useLocation();
    const { isAuthenticated, publicKey } = useNostrAuth();
    const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
    const [subscriptionStatus, setSubscriptionStatus] = useState<{
        isValid: boolean;
        checked: boolean;
    }>({ isValid: false, checked: false });
    const checkInProgressRef = useRef(false);
    const subscriptionCheckCache = useRef<Map<string, { isValid: boolean; timestamp: number }>>(new Map());

    useEffect(() => {
        const checkSubscription = async () => {
            // Skip subscription check for public pages (except signin where we want to redirect existing subscribers)
            if (location.pathname === '/signup' || location.pathname === '/payment') {
                setSubscriptionStatus({ isValid: false, checked: true });
                return;
            }

            // Don't check if already checking or no public key available
            if (checkInProgressRef.current || isCheckingSubscription || !publicKey) {
                return;
            }

            try {
                checkInProgressRef.current = true;
                setIsCheckingSubscription(true);
                console.log('SubscriptionGuard: Checking subscription for public key:', publicKey);

                // Check cache first (cache for 5 minutes)
                const cachedResult = subscriptionCheckCache.current.get(publicKey);
                const now = Date.now();
                if (cachedResult && (now - cachedResult.timestamp) < 5 * 60 * 1000) {
                    console.log('SubscriptionGuard: Using cached subscription result:', cachedResult.isValid);

                    // If on signin page and has valid subscription, redirect to form
                    if (location.pathname === '/signin' && cachedResult.isValid) {
                        console.log('SubscriptionGuard: Valid subscription on signin page, redirecting to form');
                        setSubscriptionStatus({ isValid: cachedResult.isValid, checked: true });
                        return;
                    }

                    setSubscriptionStatus({ isValid: cachedResult.isValid, checked: true });
                    return;
                }

                // Check subscription via API
                const functionUrl = getApiUrl('checkSubscription');
                const response = await fetch(functionUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ publicKey })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                console.log('SubscriptionGuard: Subscription check result:', result);

                // Cache the result
                subscriptionCheckCache.current.set(publicKey, {
                    isValid: result.isValid,
                    timestamp: Date.now()
                });

                // If on signin page and has valid subscription, redirect to form
                if (location.pathname === '/signin' && result.isValid) {
                    console.log('SubscriptionGuard: Valid subscription on signin page, redirecting to form');
                }

                setSubscriptionStatus({ isValid: result.isValid, checked: true });
            } catch (error) {
                console.error('SubscriptionGuard: Error checking subscription:', error);
                setSubscriptionStatus({ isValid: false, checked: true });
            } finally {
                setIsCheckingSubscription(false);
                checkInProgressRef.current = false;
            }
        };

        checkSubscription();
    }, [publicKey, location.pathname, isCheckingSubscription]);

    // Show loading while checking subscription
    if (isCheckingSubscription || !subscriptionStatus.checked) {
        console.log('SubscriptionGuard: Showing loading state');
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#49BB5B] mx-auto mb-4"></div>
                    <p className="text-[#01013C]">Checking subscription...</p>
                </div>
            </div>
        );
    }

    // Allow access to public pages regardless of subscription
    if (location.pathname === '/signup' || location.pathname === '/payment') {
        console.log('SubscriptionGuard: Allowing access to public page:', location.pathname);
        return <>{children}</>;
    }

    // Special handling for signin page
    if (location.pathname === '/signin') {
        if (subscriptionStatus.isValid) {
            console.log('SubscriptionGuard: Valid subscription on signin page, redirecting to form');
            return <Navigate to="/form" replace />;
        } else {
            console.log('SubscriptionGuard: No valid subscription on signin page, allowing access');
            return <>{children}</>;
        }
    }

    // For protected pages, check subscription status
    if (!subscriptionStatus.isValid) {
        console.log('SubscriptionGuard: No valid subscription, redirecting to signup');
        return <Navigate to="/signup" replace />;
    }

    console.log('SubscriptionGuard: Valid subscription found, allowing access');
    return <>{children}</>;
};

export default SubscriptionGuard; 