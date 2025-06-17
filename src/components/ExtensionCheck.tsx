import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNostrAuth } from '@/contexts/NostrAuthContext';
import { nostrService } from '@/lib/nostr';

interface ExtensionCheckProps {
    children: React.ReactNode;
}

const ExtensionCheck: React.FC<ExtensionCheckProps> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { hasNostrExtension, isCheckingExtension, checkNostrExtension } = useNostrAuth();
    const [isCheckingContact, setIsCheckingContact] = useState(false);
    const checkInProgressRef = useRef(false);
    const contactCheckCache = useRef<Map<string, { exists: boolean; timestamp: number }>>(new Map());

    useEffect(() => {
        console.log('ExtensionCheck: Current path:', location.pathname);
        // Don't check if we're already on form page (post-payment) or payment page (pre-payment)
        if (location.pathname === '/form' || location.pathname === '/payment') {
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

            // Skip enforcement for form page (post-payment) and payment page (pre-payment)
            if (currentPath === '/form' || currentPath === '/payment') {
                return;
            }

            // Wait for extension check to complete or if check already in progress
            if (isCheckingExtension || isCheckingContact || checkInProgressRef.current) {
                return;
            }

            // 1. No NIP-07 extension → redirect to /signup
            if (!hasNostrExtension) {
                console.log('ExtensionCheck: No extension found, redirecting to signup');
                navigate('/signup');
                return;
            }

            // 2. Has NIP-07 extension → check if contact exists in Zaprite
            try {
                checkInProgressRef.current = true;
                setIsCheckingContact(true);
                console.log('ExtensionCheck: Extension found, checking contact status');

                // Get public key from extension
                const publicKey = await nostrService.getPublicKey();
                console.log('ExtensionCheck: Got public key:', publicKey);

                // Check cache first (cache for 5 minutes)
                const cachedResult = contactCheckCache.current.get(publicKey);
                const now = Date.now();
                if (cachedResult && (now - cachedResult.timestamp) < 5 * 60 * 1000) {
                    console.log('ExtensionCheck: Using cached result:', cachedResult.exists);

                    if (cachedResult.exists) {
                        if (currentPath !== '/signin') {
                            console.log('ExtensionCheck: Cached - Contact exists, redirecting to signin');
                            navigate('/signin');
                        } else {
                            console.log('ExtensionCheck: Cached - Contact exists, staying on signin');
                        }
                    } else {
                        if (currentPath !== '/signup') {
                            console.log('ExtensionCheck: Cached - Contact does not exist, redirecting to signup');
                            navigate('/signup');
                        } else {
                            console.log('ExtensionCheck: Cached - Contact does not exist, staying on signup');
                        }
                    }
                    return;
                }

                // Check if contact exists
                // Use Netlify dev server URL for local development
                const isLocalhost = window.location.hostname === 'localhost';
                const functionUrl = isLocalhost
                    ? 'http://localhost:8888/.netlify/functions/check-contact'
                    : '/.netlify/functions/check-contact';

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
                console.log('ExtensionCheck: Contact check result:', result);

                // Cache the result
                contactCheckCache.current.set(publicKey, {
                    exists: result.exists,
                    timestamp: Date.now()
                });

                if (result.exists) {
                    // Contact found → redirect to /signin (or stay on /signin if already there)
                    if (currentPath !== '/signin') {
                        console.log('ExtensionCheck: Contact exists, redirecting to signin');
                        navigate('/signin');
                    } else {
                        console.log('ExtensionCheck: Contact exists, staying on signin');
                    }
                } else {
                    // Contact not found → redirect to /signup (or stay on /signup if already there)
                    if (currentPath !== '/signup') {
                        console.log('ExtensionCheck: Contact does not exist, redirecting to signup');
                        navigate('/signup');
                    } else {
                        console.log('ExtensionCheck: Contact does not exist, staying on signup');
                    }
                }
            } catch (error) {
                console.error('ExtensionCheck: Error checking contact:', error);
                // On error, default to signup flow
                if (currentPath !== '/signup') {
                    navigate('/signup');
                }
            } finally {
                setIsCheckingContact(false);
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