import React, { useState } from 'react';
import { useNostrAuth } from '@/contexts/NostrAuthContext';
import { delegationManager } from '../lib/delegation';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';

interface DelegationStepProps {
    onComplete: () => void;
    onSkip: () => void;
}

const DelegationStep: React.FC<DelegationStepProps> = ({ onComplete, onSkip }) => {
    const { publicKey } = useNostrAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuthorize = async () => {
        if (!publicKey) {
            setError('No public key available. Please sign in first.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Get backend server's public key
            const backendPubkey = await delegationManager.getBackendPubkey(publicKey);

            // Submit the delegation
            const result = await delegationManager.submitDelegation(
                publicKey,
                backendPubkey,
                30 // 30 days
            );

            if (result.success) {
                onComplete();
            } else {
                setError(result.error || 'Failed to create delegation');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#9F7AEA] rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-[#01013C] mb-4">
                        Authorization Required
                    </h1>
                    <p className="text-lg text-gray-600 mb-8">
                        I authorize Synvya to publish my information. The authorization is valid for 30 days.
                    </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 mb-8">
                    <h3 className="font-semibold text-[#01013C] mb-3">What this allows:</h3>
                    <ul className="space-y-2 text-gray-700">
                        <li className="flex items-center">
                            <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Publish and update your product listings
                        </li>
                        <li className="flex items-center">
                            <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Update your merchant profile information
                        </li>
                        <li className="flex items-center">
                            <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Manage your storefront automatically
                        </li>
                    </ul>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <PrimaryButton
                        onClick={handleAuthorize}
                        disabled={isLoading}
                        className="min-w-[200px]"
                    >
                        {isLoading ? 'Authorizing...' : 'Authorize Synvya'}
                    </PrimaryButton>

                    <SecondaryButton
                        onClick={onSkip}
                        disabled={isLoading}
                        className="min-w-[200px]"
                    >
                        Skip for Now
                    </SecondaryButton>
                </div>

                <p className="text-sm text-gray-500 text-center mt-6">
                    You can revoke this authorization at any time from your settings.
                </p>
            </div>
        </div>
    );
};

export default DelegationStep; 