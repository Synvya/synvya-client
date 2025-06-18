import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNostrAuth } from '@/contexts/NostrAuthContext';
import NavHeader from '@/components/NavHeader';
import PrimaryButton from '@/components/PrimaryButton';


const PaymentPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, publicKey } = useNostrAuth();
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual' | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const plans = [
        {
            id: 'monthly' as const,
            name: 'Monthly Subscription',
            price: 9.99,
            description: '',
            features: [
                'Publish business info',
                'Publish product catalog',
                'Support during business hours (Pacific Time)',
                'Coming soon: receive orders directly from AI apps'
            ]
        },
        {
            id: 'annual' as const,
            name: 'Annual Subscription',
            price: 99,
            description: '',
            features: [
                'Publish business info',
                'Publish product catalog',
                'Priority support during business hours (Pacific Time)',
                'Annual billing discount (17% savings!)',
                'Coming soon: receive orders directly from AI apps'
            ]
        }
    ];

    const createZapriteOrder = async (planType: 'monthly' | 'annual') => {
        if (!publicKey) {
            throw new Error('Public key not available');
        }

        // Use serverless function to avoid CORS issues
        const endpoint = import.meta.env.DEV
            ? 'http://localhost:8888/.netlify/functions/create-zaprite-order'  // Local development (Netlify dev server)
            : '/.netlify/functions/create-zaprite-order'; // Production

        console.log('Creating Zaprite order via serverless function...');

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    planType,
                    publicKey
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Serverless function error:', errorData);
                throw new Error(errorData.error || `Failed to create order: ${response.status}`);
            }

            const result = await response.json();
            console.log('Zaprite order created successfully:', result);
            return result;
        } catch (error) {
            console.error('Error calling serverless function:', error);
            throw error;
        }
    };

    const handleSelectPlan = (planId: 'monthly' | 'annual') => {
        setSelectedPlan(planId);
        setError(null);
    };

    const handleProceedToPayment = async () => {
        if (!selectedPlan) return;

        setIsLoading(true);
        setError(null);

        try {
            const order = await createZapriteOrder(selectedPlan);
            console.log('Order response from Zaprite:', order);

            // Redirect to Zaprite checkout page
            if (order.checkoutUrl) {
                window.location.href = order.checkoutUrl;
            } else {
                throw new Error('No checkout URL received from Zaprite');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create payment order');
        } finally {
            setIsLoading(false);
        }
    };



    if (!isAuthenticated) {
        navigate('/signin');
        return null;
    }

    return (
        <div className="min-h-screen bg-[#F6F6F9]">
            <NavHeader />
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-[#01013C] mb-4">
                            Become Visible Again
                        </h1>
                        <p className="text-gray-600 text-lg">
                            Choose your Synvya plan
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-sm font-medium text-red-800">{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`relative border-2 rounded-2xl p-6 cursor-pointer transition-all duration-200 min-h-[300px] ${selectedPlan === plan.id
                                    ? 'border-[#49BB5B] bg-green-50'
                                    : 'border-gray-200 hover:border-[#49BB5B]'
                                    }`}
                                onClick={() => handleSelectPlan(plan.id)}
                            >
                                {plan.id === 'annual' && (
                                    <div className="absolute -top-2 left-4 bg-[#49BB5B] text-white text-center py-1 px-3 rounded-full">
                                        <span className="font-semibold text-xs">17% SAVINGS</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-semibold text-[#01013C]">
                                        {plan.name}
                                    </h3>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlan === plan.id ? 'border-[#49BB5B] bg-[#49BB5B]' : 'border-gray-300'
                                        }`}>
                                        {selectedPlan === plan.id && (
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <span className="text-3xl font-bold text-[#01013C]">${plan.price}</span>
                                    <span className="text-gray-600 ml-1">/{plan.id === 'monthly' ? 'month' : 'year'}</span>
                                </div>

                                {plan.description && (
                                    <p className="text-gray-600 mb-4">{plan.description}</p>
                                )}

                                <ul className="space-y-2">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-start">
                                            <svg className="w-5 h-5 text-[#49BB5B] mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm text-gray-700">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-center">
                        <PrimaryButton
                            onClick={handleProceedToPayment}
                            disabled={!selectedPlan || isLoading}
                            className="px-8 py-3"
                        >
                            {isLoading ? 'Creating Payment...' : 'Proceed to Payment'}
                        </PrimaryButton>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage; 