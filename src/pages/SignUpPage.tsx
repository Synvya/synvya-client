
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNostrAuth } from '@/contexts/NostrAuthContext';
import Logo from '@/components/Logo';
import PrimaryButton from '@/components/PrimaryButton';
import Checkbox from '@/components/Checkbox';
import NostrExtensionModal from '@/components/NostrExtensionModal';
import { detectBrowser, getExtensionRecommendations } from '@/utils/browserDetection';
import { getApiUrl } from '@/utils/apiConfig';

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, isLoading, error, hasNostrExtension, checkNostrExtension } = useNostrAuth();
  const [showModal, setShowModal] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [browserType] = useState(() => detectBrowser());
  const [extensionRecommendations] = useState(() => getExtensionRecommendations(browserType));
  const [checkingExistingUser, setCheckingExistingUser] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);

  // Check for extension on component mount and periodically until found
  useEffect(() => {
    checkNostrExtension();

    // Only set up interval if extension is not found
    if (!hasNostrExtension) {
      const interval = setInterval(() => {
        const found = checkNostrExtension();
        if (found) {
          clearInterval(interval);
        }
      }, 1000); // Check every second until found

      return () => clearInterval(interval);
    }
  }, [checkNostrExtension, hasNostrExtension]);

  // Check if user already exists when extension is available
  useEffect(() => {
    if (hasNostrExtension && isExistingUser === null) {
      checkIfUserExists();
    }
  }, [hasNostrExtension, isExistingUser]);

  // Redirect existing users to sign in
  useEffect(() => {
    if (isExistingUser === true) {
      const timer = setTimeout(() => {
        navigate('/signin');
      }, 2000); // Give them time to read the message
      return () => clearTimeout(timer);
    }
  }, [isExistingUser, navigate]);

  const checkIfUserExists = async () => {
    try {
      setCheckingExistingUser(true);

      // Get public key from extension to check if user exists
      const publicKey = await (window as any).nostr.getPublicKey();
      console.log('Checking if user exists with public key:', publicKey);

      const response = await fetch(`${getApiUrl('checkUserExists')}?publicKey=${publicKey}`);
      const result = await response.json();

      console.log('User existence check result:', result);
      setIsExistingUser(result.exists);

    } catch (error) {
      console.error('Error checking if user exists:', error);
      // If check fails, assume new user to allow signup flow
      setIsExistingUser(false);
    } finally {
      setCheckingExistingUser(false);
    }
  };

  const canSignUp = hasNostrExtension && termsAgreed && isExistingUser === false;

  const handleSignUp = async () => {
    if (!canSignUp) return;

    try {
      // Authenticate the user
      await signUp();

      // Get public key again for terms recording
      const publicKey = await (window as any).nostr.getPublicKey();

      // Record terms acceptance and go to form
      console.log('New user, recording terms acceptance');
      await recordTermsAcceptanceServerSide(publicKey);
      navigate('/form');

    } catch (err) {
      console.error('Sign up error:', err);
      if (err instanceof Error && err.message.includes('extension not found')) {
        setShowModal(true);
      }
    }
  };

  const recordTermsAcceptanceServerSide = async (userPublicKey: string) => {
    try {
      const response = await fetch(getApiUrl('recordTermsAcceptance'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicKey: userPublicKey,
          termsVersion: '1.0'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to record terms acceptance: ${response.status}`);
      }

      const result = await response.json();
      console.log('Terms acceptance recorded server-side:', result);
    } catch (error) {
      console.error('Failed to record terms acceptance server-side:', error);
      // Note: We don't block the user flow if this fails, but we log it
    }
  };

  const handleRetry = () => {
    setShowModal(false);
    handleSignUp();
  };

  // Show existing user message
  if (isExistingUser === true) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F6F9] px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-8">
              <Logo className="mx-auto mb-4 text-3xl" />
              <h1 className="text-2xl font-bold text-[#01013C] mb-2">
                Welcome Back!
              </h1>
              <p className="text-gray-600 text-sm">
                You already have an account. Redirecting to sign in...
              </p>
            </div>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#49BB5B] mr-3"></div>
                <p className="text-blue-700 text-sm">
                  Redirecting to sign in page...
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Click here if you're not redirected automatically:{' '}
              <Link
                to="/signin"
                className="text-[#49BB5B] hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F6F9] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-8">
            <Logo className="mx-auto mb-4 text-3xl" />
            <h1 className="text-2xl font-bold text-[#01013C] mb-2">
              Sign up for FREE
            </h1>
            <p className="text-gray-600 text-sm">
              Publish your business info and product catalog in an AI-friendly way.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Extension Detection */}
            <div className="text-left">
              <h3 className="text-lg font-semibold text-[#01013C] mb-3">Step 1: Install Nostr Extension</h3>

              {!hasNostrExtension && (
                <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                  <p className="text-orange-700 text-sm mb-2">
                    You need a Nostr extension to sign up. We recommend:
                  </p>
                  <div className="space-y-2">
                    {extensionRecommendations.extensions.map((extension, index) => (
                      <div key={index} className="text-sm">
                        <a
                          href={extension.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#49BB5B] hover:underline font-medium"
                        >
                          {extension.name}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasNostrExtension && checkingExistingUser && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#49BB5B] mr-3"></div>
                    <p className="text-blue-700 text-sm">
                      Checking if you already have an account...
                    </p>
                  </div>
                </div>
              )}

              {hasNostrExtension && !checkingExistingUser && isExistingUser === false && (
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
            </div>

            {/* Terms Agreement */}
            <div className="text-left">
              <h3 className="text-lg font-semibold text-[#01013C] mb-3">Step 2: Accept Terms</h3>

              <Checkbox
                id="terms"
                label="I agree to the Terms of Service and Privacy Policy."
                checked={termsAgreed}
                onChange={setTermsAgreed}
                disabled={!hasNostrExtension || checkingExistingUser || isExistingUser !== false}
              />
            </div>

            <PrimaryButton
              onClick={handleSignUp}
              disabled={isLoading || !canSignUp || checkingExistingUser}
              className="w-full"
            >
              {isLoading ? 'Signing Up...' : 'Sign Up Now'}
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

            <div className="text-xs text-gray-500 space-x-4">
              <a
                href="https://d.nostr.build/X94MRGirObzXoU2O.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#49BB5B] hover:underline"
              >
                Terms of Service
              </a>
              <span>•</span>
              <a
                href="https://d.nostr.build/X94MRGirObzXoU2O.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#49BB5B] hover:underline"
              >
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <NostrExtensionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
};

export default SignUpPage;
