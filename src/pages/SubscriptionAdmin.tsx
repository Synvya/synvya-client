import React, { useState } from 'react';
import { useSubscription, hasValidSubscription, getSubscriptionStatusMessage } from '@/hooks/useSubscription';
import PrimaryButton from '@/components/PrimaryButton';
import SecondaryButton from '@/components/SecondaryButton';

const SubscriptionAdmin: React.FC = () => {
    const [publicKeyInput, setPublicKeyInput] = useState('');
    const { subscription, isLoading, error, checkSubscription } = useSubscription();

    const handleCheckSubscription = () => {
        if (publicKeyInput.trim()) {
            checkSubscription(publicKeyInput.trim());
        }
    };

    return (
        <div className="min-h-screen bg-[#F6F6F9] p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h1 className="text-3xl font-bold text-[#01013C] mb-8">
                        Subscription Database Admin
                    </h1>

                    {/* Input Section */}
                    <div className="mb-8">
                        <label htmlFor="publicKey" className="block text-sm font-medium text-gray-700 mb-2">
                            Public Key (Hex)
                        </label>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                id="publicKey"
                                value={publicKeyInput}
                                onChange={(e) => setPublicKeyInput(e.target.value)}
                                placeholder="Enter public key to check subscription..."
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#49BB5B] focus:border-transparent transition-all duration-200"
                            />
                            <PrimaryButton
                                onClick={handleCheckSubscription}
                                disabled={!publicKeyInput.trim() || isLoading}
                                className="px-6"
                            >
                                {isLoading ? 'Checking...' : 'Check Subscription'}
                            </PrimaryButton>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-sm font-medium text-red-800">Error: {error}</p>
                        </div>
                    )}

                    {/* Results Display */}
                    {subscription && (
                        <div className="space-y-6">
                            {/* Status Overview */}
                            <div className={`p-6 rounded-xl border-2 ${hasValidSubscription(subscription)
                                    ? 'border-green-200 bg-green-50'
                                    : 'border-red-200 bg-red-50'
                                }`}>
                                <h2 className="text-xl font-semibold text-[#01013C] mb-2">
                                    Subscription Status
                                </h2>
                                <p className={`text-lg font-medium ${hasValidSubscription(subscription) ? 'text-green-800' : 'text-red-800'
                                    }`}>
                                    {getSubscriptionStatusMessage(subscription)}
                                </p>
                            </div>

                            {/* Detailed Information */}
                            {subscription.subscription && (
                                <div className="bg-gray-50 p-6 rounded-xl">
                                    <h3 className="text-lg font-semibold text-[#01013C] mb-4">
                                        Subscription Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Contact ID</label>
                                            <p className="text-sm font-mono bg-white p-2 rounded border">
                                                {subscription.subscription.contactId}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Order ID</label>
                                            <p className="text-sm font-mono bg-white p-2 rounded border">
                                                {subscription.subscription.orderId}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Plan Type</label>
                                            <p className="text-sm bg-white p-2 rounded border capitalize">
                                                {subscription.subscription.planType}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Status</label>
                                            <p className={`text-sm p-2 rounded border capitalize font-medium ${subscription.subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    subscription.subscription.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                }`}>
                                                {subscription.subscription.status}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Valid Through</label>
                                            <p className="text-sm bg-white p-2 rounded border">
                                                {subscription.subscription.validThrough}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Days Remaining</label>
                                            <p className={`text-sm p-2 rounded border font-medium ${subscription.daysRemaining > 7 ? 'bg-green-100 text-green-800' :
                                                    subscription.daysRemaining > 0 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                }`}>
                                                {subscription.daysRemaining} days
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Email</label>
                                            <p className="text-sm bg-white p-2 rounded border">
                                                {subscription.subscription.email}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Last Updated</label>
                                            <p className="text-sm bg-white p-2 rounded border">
                                                {new Date(subscription.subscription.lastUpdated).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Raw Data */}
                            <details className="bg-gray-50 p-6 rounded-xl">
                                <summary className="text-lg font-semibold text-[#01013C] cursor-pointer mb-4">
                                    Raw API Response
                                </summary>
                                <pre className="text-xs bg-white p-4 rounded border overflow-auto">
                                    {JSON.stringify(subscription, null, 2)}
                                </pre>
                            </details>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">
                            Testing Instructions
                        </h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• In development, subscription data is stored in <code>netlify/functions/data/subscriptions.json</code></li>
                            <li>• In production, data is stored encrypted in S3</li>
                            <li>• Create test subscriptions by going through the payment flow</li>
                            <li>• Use this page to verify subscription data is being saved correctly</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionAdmin; 