
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNostrAuth } from '@/contexts/NostrAuthContext';
import Logo from '@/components/Logo';
import PrimaryButton from '@/components/PrimaryButton';
import Checkbox from '@/components/Checkbox';
import NostrExtensionModal from '@/components/NostrExtensionModal';
import { detectBrowser, getExtensionRecommendations } from '@/utils/browserDetection';

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, isLoading, error, isAuthenticated, hasNostrExtension, checkNostrExtension } = useNostrAuth();
  const [showModal, setShowModal] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [browserType] = useState(() => detectBrowser());
  const [extensionRecommendations] = useState(() => getExtensionRecommendations(browserType));

  // Don't auto-redirect when authenticated - let signup flow handle payment page first

  // Check for extension on component mount and periodically
  useEffect(() => {
    checkNostrExtension();
    const interval = setInterval(checkNostrExtension, 1000); // Check every second
    return () => clearInterval(interval);
  }, [checkNostrExtension]);

  const canSignUp = hasNostrExtension && termsAgreed;

  const handleSignUp = async () => {
    if (!canSignUp) return;

    try {
      await signUp();
      // After successful authentication, redirect to payment page
      navigate('/payment');
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
              {/* Extension Warning/Status */}
              {!hasNostrExtension ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Nostr browser extension not found
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>Please install an extension like{' '}
                          {extensionRecommendations.extensions.map((ext, index) => (
                            <span key={ext.name}>
                              <a
                                href={ext.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-yellow-900"
                              >
                                {ext.name}
                              </a>
                              {index < extensionRecommendations.extensions.length - 1 &&
                                (index === extensionRecommendations.extensions.length - 2 ? ', or ' : ', ')
                              }
                            </span>
                          ))}
                          .
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        Nostr extension detected! You can now proceed.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Checkbox
                id="terms"
                label="I agree to the Terms of Service and Privacy Policy."
                checked={termsAgreed}
                onChange={setTermsAgreed}
                disabled={!hasNostrExtension}
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
                className="text-[#49BB5B] hover:underline font-medium"
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
