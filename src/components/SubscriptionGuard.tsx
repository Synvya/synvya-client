import React from 'react';
import { Navigate } from 'react-router-dom';
import { useNostrAuth } from '@/contexts/NostrAuthContext';
import { useSubscription, hasValidSubscription } from '@/hooks/useSubscription';

interface SubscriptionGuardProps {
    children: React.ReactNode;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
    const { isAuthenticated, isLoading: authLoading, publicKey } = useNostrAuth();
    const { subscription, isLoading: subLoading } = useSubscription(publicKey || undefined);

    console.log('SubscriptionGuard: isAuthenticated:', isAuthenticated, 'authLoading:', authLoading, 'publicKey:', publicKey);
    console.log('SubscriptionGuard: subscription:', subscription, 'subLoading:', subLoading);

    // Show loading while checking authentication or subscription
    if (authLoading || subLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#49BB5B] mx-auto mb-4"></div>
                    <p className="text-[#01013C]">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to signin if not authenticated
    if (!isAuthenticated) {
        console.log('SubscriptionGuard: Redirecting to signin - user not authenticated');
        return <Navigate to="/signin" replace />;
    }

    // Check if user has valid subscription
    const hasValidSub = hasValidSubscription(subscription);

    // Redirect to payment if authenticated but no valid subscription
    if (!hasValidSub) {
        console.log('SubscriptionGuard: Redirecting to payment - user authenticated but no valid subscription');
        return <Navigate to="/payment" replace />;
    }

    console.log('SubscriptionGuard: Access granted - user authenticated with valid subscription');
    return <>{children}</>;
};

export default SubscriptionGuard; 