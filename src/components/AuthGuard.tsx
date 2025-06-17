
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useNostrAuth } from '@/contexts/NostrAuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useNostrAuth();

  console.log('AuthGuard: isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9F7AEA] mx-auto mb-4"></div>
          <p className="text-[#01013C]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('AuthGuard: Redirecting to signin - user not authenticated');
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
