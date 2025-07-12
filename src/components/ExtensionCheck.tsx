import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNostrAuth } from '@/contexts/NostrAuthContext';

interface ExtensionCheckProps {
    children: React.ReactNode;
}

const ExtensionCheck: React.FC<ExtensionCheckProps> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { hasNostrExtension, isCheckingExtension, checkNostrExtension, extensionChecked } = useNostrAuth();

    useEffect(() => {
        console.log('ExtensionCheck: Current path:', location.pathname);

        // Only check for extension if not already checked
        if (!extensionChecked) {
            console.log('ExtensionCheck: Checking for extension (first time)');
            checkNostrExtension();
        }
    }, [extensionChecked, checkNostrExtension, location.pathname]);

    useEffect(() => {
        const currentPath = location.pathname;
        console.log('ExtensionCheck: hasNostrExtension:', hasNostrExtension, 'isCheckingExtension:', isCheckingExtension, 'path:', currentPath);

        // Wait for extension check to complete
        if (isCheckingExtension) {
            return;
        }

        // If no extension and not on signup/signin pages, redirect to signup
        if (!hasNostrExtension && currentPath !== '/signup' && currentPath !== '/signin') {
            console.log('ExtensionCheck: No extension found, redirecting to signup');
            navigate('/signup');
            return;
        }

        console.log('ExtensionCheck: Extension check complete, allowing page to render');
    }, [hasNostrExtension, isCheckingExtension, location.pathname, navigate]);

    return <>{children}</>;
};

export default ExtensionCheck; 