import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNostrAuth } from '@/contexts/NostrAuthContext';
import { nostrService } from '@/lib/nostr';
import { getApiUrl } from '@/utils/apiConfig';

interface ExtensionCheckProps {
    children: React.ReactNode;
}

const ExtensionCheck: React.FC<ExtensionCheckProps> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { hasNostrExtension, isCheckingExtension, checkNostrExtension } = useNostrAuth();
    const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
    const checkInProgressRef = useRef(false);
    const subscriptionCheckCache = useRef<Map<string, { exists: boolean; timestamp: number }>>(new Map());

    useEffect(() => {
        console.log('ExtensionCheck: Current path:', location.pathname);
        // Don't check if we're already on form page (post-payment), payment page (pre-payment), orders page, or admin pages
        if (location.pathname === '/form' || location.pathname === '/payment' || location.pathname === '/orders' || location.pathname.startsWith('/admin/')) {
            console.log('ExtensionCheck: Skipping check for', location.pathname);
            return;
        }

        // Check for extension
        console.log('ExtensionCheck: Checking for extension');
        checkNostrExtension();
    }, [location.pathname, checkNostrExtension]);

    useEffect(() => {
        const enforceUserFlow = async () => {
            const currentPath = location.pathname;
            console.log('ExtensionCheck: hasNostrExtension:', hasNostrExtension, 'isCheckingExtension:', isCheckingExtension, 'path:', currentPath);

            // Skip enforcement for form page (post-payment), payment page (pre-payment), orders page, and admin pages
            if (currentPath === '/form' || currentPath === '/payment' || currentPath === '/orders' || currentPath.startsWith('/admin/')) {
                return;
            }

            // Wait for extension check to complete or if check already in progress
            if (isCheckingExtension || isCheckingSubscription || checkInProgressRef.current) {
                return;
            }

            // 1. No NIP-07 extension → redirect to /signup
            if (!hasNostrExtension) {
                console.log('ExtensionCheck: No extension found, redirecting to signup');
                navigate('/signup');
                return;
            }

            // 2. Has NIP-07 extension → check if user has active subscription
            try {
                checkInProgressRef.current = true;
                setIsCheckingSubscription(true);
                console.log('ExtensionCheck: Extension found, checking subscription status');

                // Get public key from extension
                const publicKey = await nostrService.getPublicKey();
                console.log('ExtensionCheck: Got public key:', publicKey);

                // Check cache first (cache for 5 minutes)
                const cachedResult = subscriptionCheckCache.current.get(publicKey);
                const now = Date.now();
                if (cachedResult && (now - cachedResult.timestamp) < 5 * 60 * 1000) {
                    console.log('ExtensionCheck: Using cached result:', cachedResult.exists);

                    if (cachedResult.exists) {
                        if (currentPath !== '/signin') {
                            console.log('ExtensionCheck: Cached - Active subscription found, redirecting to signin');
                            navigate('/signin');
                        } else {
                            console.log('ExtensionCheck: Cached - Active subscription found, staying on signin');
                        }
                    } else {
                        if (currentPath !== '/signup') {
                            console.log('ExtensionCheck: Cached - No active subscription, redirecting to signup');
                            navigate('/signup');
                        } else {
                            console.log('ExtensionCheck: Cached - No active subscription, staying on signup');
                        }
                    }
                    return;
                }

                // Check if user has active subscription using API configuration utility
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
                console.log('ExtensionCheck: Subscription check result:', result);

                // Cache the result (using exists field for consistency with existing cache structure)
                const hasActiveSubscription = result.isValid;
                subscriptionCheckCache.current.set(publicKey, {
                    exists: hasActiveSubscription,
                    timestamp: Date.now()
                });

                if (hasActiveSubscription) {
                    // Active subscription found → redirect to /signin (or stay on /signin if already there)
                    if (currentPath !== '/signin') {
                        console.log('ExtensionCheck: Active subscription found, redirecting to signin');
                        navigate('/signin');
                    } else {
                        console.log('ExtensionCheck: Active subscription found, staying on signin');
                    }
                } else {
                    // No active subscription → redirect to /signup (or stay on /signup if already there)
                    if (currentPath !== '/signup') {
                        console.log('ExtensionCheck: No active subscription, redirecting to signup');
                        navigate('/signup');
                    } else {
                        console.log('ExtensionCheck: No active subscription, staying on signup');
                    }
                }
            } catch (error) {
                console.error('ExtensionCheck: Error checking subscription:', error);
                // On error, default to signup flow
                if (currentPath !== '/signup') {
                    navigate('/signup');
                }
            } finally {
                setIsCheckingSubscription(false);
                checkInProgressRef.current = false;
            }
        };

        enforceUserFlow();
    }, [hasNostrExtension, isCheckingExtension, location.pathname, navigate]);

    // Always render children - background checks will handle redirects as needed
    // This ensures signup and signin pages always show their content while checks happen
    return <>{children}</>;
};

export default ExtensionCheck; 