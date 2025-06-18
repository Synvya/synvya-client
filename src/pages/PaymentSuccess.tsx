import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNostrAuth } from '@/contexts/NostrAuthContext';
import NavHeader from '@/components/NavHeader';
import PrimaryButton from '@/components/PrimaryButton';

const PaymentSuccess: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useNostrAuth();
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(true);

    // Get payment details from URL parameters
    const orderId = searchParams.get('order_id');
    const planType = searchParams.get('plan');
    const amount = searchParams.get('amount');

    useEffect(() => {
        console.log('PaymentSuccess mounted');
        console.log('URL params:', { orderId, planType, amount });
        console.log('Is authenticated:', isAuthenticated);

        // Simulate loading/verification
        const timer = setTimeout(() => {
            console.log('Loading finished');
            setIsLoading(false);
        }, 2000);

        return () => clearTimeout(timer);
    }, [orderId, planType, amount, isAuthenticated]);

    const handleContinue = () => {
        if (isAuthenticated) {
            navigate('/form');
        } else {
            // If not authenticated, redirect to signin with a message to continue
            navigate('/signin');
        }
    };

    // Note: We don't redirect unauthenticated users since they're coming from payment
    // Instead, we'll show a different flow for non-authenticated users

    console.log('Rendering PaymentSuccess, isLoading:', isLoading);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F6F6F9]">
                <NavHeader />
                <div className="max-w-2xl mx-auto px-4 py-8">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#49BB5B] mx-auto mb-4"></div>
                        <h2 className="text-2xl font-bold text-[#01013C] mb-2">
                            Verifying Payment...
                        </h2>
                        <p className="text-gray-600">
                            Please wait while we confirm your payment
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F6F6F9]">
            <NavHeader />
            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                    {/* Success Icon */}
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <h1 className="text-3xl font-bold text-[#01013C] mb-4">
                        Payment Successful!
                    </h1>

                    <p className="text-lg text-gray-600 mb-6">
                        Thank you for subscribing to Synvya. Your payment has been processed successfully.
                    </p>

                    {/* Payment Details */}
                    <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
                        <h3 className="font-semibold text-[#01013C] mb-4">Payment Details</h3>
                        <div className="space-y-2 text-sm">
                            {orderId && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Order ID:</span>
                                    <span className="font-medium">{orderId}</span>
                                </div>
                            )}
                            {planType && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Plan:</span>
                                    <span className="font-medium capitalize">{planType} Subscription</span>
                                </div>
                            )}
                            {amount && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Amount:</span>
                                    <span className="font-medium">${amount}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-600">Status:</span>
                                <span className="font-medium text-green-600">Paid</span>
                            </div>
                        </div>
                    </div>

                    {/* Next Steps */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 text-left">
                        <h3 className="font-semibold text-[#01013C] mb-2">What's Next?</h3>
                        <ul className="text-sm text-gray-700 space-y-1">
                            <li>• Complete your merchant profile setup</li>
                            <li>• Add your business information and products</li>
                            <li>• Start building your Nostr presence</li>
                            <li>• Access all premium features</li>
                        </ul>
                    </div>

                    <PrimaryButton onClick={handleContinue} className="w-full py-4">
                        Continue to Profile Setup
                    </PrimaryButton>

                    <p className="text-sm text-gray-500 mt-4">
                        You will receive a confirmation email shortly with your subscription details.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess; 