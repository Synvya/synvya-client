
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNostrAuth } from '@/contexts/NostrAuthContext';
import Logo from './Logo';
import SecondaryButton from './SecondaryButton';

const NavHeader: React.FC = () => {
  const navigate = useNavigate();
  const { logout, publicKey } = useNostrAuth();

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Logo />
          
          <div className="flex items-center space-x-4">
            {publicKey && (
              <span className="text-sm text-gray-600">
                {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
              </span>
            )}
            <SecondaryButton onClick={handleLogout} className="px-4 py-2">
              Sign Out
            </SecondaryButton>
          </div>
        </div>
      </div>
    </header>
  );
};

export default NavHeader;
