
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNostrAuth } from '@/contexts/NostrAuthContext';
import Logo from '@/components/Logo';
import PrimaryButton from '@/components/PrimaryButton';
import Checkbox from '@/components/Checkbox';
import NostrExtensionModal from '@/components/NostrExtensionModal';

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, isLoading, error, isAuthenticated } = useNostrAuth();
  const [showModal, setShowModal] = useState(false);
  const [extensionAgreed, setExtensionAgreed] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/form');
    }
  }, [isAuthenticated, navigate]);

  const canSignUp = extensionAgreed && termsAgreed;

  const handleSignUp = async () => {
    if (!canSignUp) return;
    
    try {
      await signUp();
    } catch (err) {
      if (err instanceof Error && err.message.includes('extension not found')) {
        setShowModal(true);
      }
    }
  };

  const handleRetry = () => {
    setShowModal(false);
    handleSignUp();
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

          <div className="space-y-6">
            <div className="space-y-4 text-left">
              <Checkbox
                id="extension"
                label="I have installed a Nostr browser extension."
                checked={extensionAgreed}
                onChange={setExtensionAgreed}
              />
              <Checkbox
                id="terms"
                label="I agree to the Terms of Service and Privacy Policy."
                checked={termsAgreed}
                onChange={setTermsAgreed}
              />
            </div>

            <PrimaryButton 
              onClick={handleSignUp}
              disabled={isLoading || !canSignUp}
              className="w-full"
            >
              {isLoading ? 'Signing Up...' : 'Sign Up'}
            </PrimaryButton>

            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link 
                to="/signin" 
                className="text-[#9F7AEA] hover:underline font-medium"
              >
                Sign in here
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

export default SignUpPage;
