
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNostrAuth } from '@/contexts/NostrAuthContext';
import Logo from '@/components/Logo';
import PrimaryButton from '@/components/PrimaryButton';
import NostrExtensionModal from '@/components/NostrExtensionModal';

const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, isLoading, error, isAuthenticated } = useNostrAuth();
  const [showModal, setShowModal] = useState(false);

  const handleSignIn = async () => {
    try {
      await signIn();
      // After successful sign in, redirect to form
      navigate('/form');
    } catch (err) {
      if (err instanceof Error && err.message.includes('extension not found')) {
        setShowModal(true);
      }
    }
  };

  const handleRetry = () => {
    setShowModal(false);
    handleSignIn();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F6F9] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-8">
            <Logo className="mx-auto mb-4 text-3xl" />
            <h1 className="text-2xl font-bold text-[#01013C] mb-2">
              Become Visible Again
            </h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <PrimaryButton
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </PrimaryButton>

            <p className="text-sm text-gray-600">
              New to Synvya?{' '}
              <Link
                to="/signup"
                className="text-[#49BB5B] hover:underline font-medium"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>

      <NostrExtensionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onRetry={handleRetry}
      />
    </div>
  );
};

export default SignInPage;
