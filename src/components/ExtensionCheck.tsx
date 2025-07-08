import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNostrAuth } from '@/contexts/NostrAuthContext';

interface ExtensionCheckProps {
    children: React.ReactNode;
}

const ExtensionCheck: React.FC<ExtensionCheckProps> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { hasNostrExtension, isCheckingExtension, checkNostrExtension, autoAuthenticate, isAuthenticated, extensionChecked, autoAuthAttempted } = useNostrAuth();

    useEffect(() => {
        console.log('ExtensionCheck: Current path:', location.pathname);

        // Only check for extension if not already checked
        if (!extensionChecked) {
            console.log('ExtensionCheck: Checking for extension (first time)');
            checkNostrExtension();
        }
    }, [extensionChecked, checkNostrExtension]);

    useEffect(() => {
        const currentPath = location.pathname;
        console.log('ExtensionCheck: hasNostrExtension:', hasNostrExtension, 'isCheckingExtension:', isCheckingExtension, 'path:', currentPath, 'isAuthenticated:', isAuthenticated);

        // Wait for extension check to complete
        if (isCheckingExtension) {
            return;
        }

        // If no extension, redirect to signup
        if (!hasNostrExtension) {
            console.log('ExtensionCheck: No extension found, redirecting to signup');
            navigate('/signup');
            return;
        }

        // If extension found but not authenticated and auto-auth not attempted, try auto-authenticate
        if (hasNostrExtension && !isAuthenticated && !autoAuthAttempted) {
            console.log('ExtensionCheck: Extension found, attempting auto-authentication');
            autoAuthenticate();
            return;
        }

        console.log('ExtensionCheck: Extension found, allowing SubscriptionGuard to handle subscription checks');
    }, [hasNostrExtension, isCheckingExtension, isAuthenticated, autoAuthAttempted, location.pathname, navigate, autoAuthenticate]);

    return <>{children}</>;
};

export default ExtensionCheck; 