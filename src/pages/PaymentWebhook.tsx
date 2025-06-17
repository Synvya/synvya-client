import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const PaymentWebhook: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [message, setMessage] = useState('Processing webhook...');

    useEffect(() => {
        const processWebhook = async () => {
            try {
                // Extract webhook data from URL parameters or request body
                const orderId = searchParams.get('order_id');
                const status = searchParams.get('status');
                const userPubkey = searchParams.get('user_pubkey');
                const planType = searchParams.get('plan_type');

                console.log('Webhook received:', {
                    orderId,
                    status,
                    userPubkey,
                    planType
                });

                // Process the webhook based on payment status
                if (status === 'completed' || status === 'paid') {
                    // Handle successful payment
                    await handleSuccessfulPayment({
                        orderId,
                        userPubkey,
                        planType
                    });
                    setStatus('success');
                    setMessage('Payment processed successfully');
                } else if (status === 'failed' || status === 'cancelled') {
                    // Handle failed/cancelled payment
                    await handleFailedPayment({
                        orderId,
                        userPubkey,
                        planType,
                        status
                    });
                    setStatus('success'); // Still success for webhook processing
                    setMessage(`Payment ${status} - webhook processed`);
                } else {
                    setStatus('error');
                    setMessage('Unknown payment status');
                }

                // Redirect user to success page if this is a browser request
                if (window.location.search.includes('redirect=true')) {
                    setTimeout(() => {
                        window.location.href = `/payment-success?${searchParams.toString()}`;
                    }, 2000);
                }

            } catch (error) {
                console.error('Webhook processing error:', error);
                setStatus('error');
                setMessage('Error processing webhook');
            }
        };

        processWebhook();
    }, [searchParams]);

    const handleSuccessfulPayment = async (data: {
        orderId: string | null;
        userPubkey: string | null;
        planType: string | null;
    }) => {
        console.log('Processing successful payment:', data);

        // Here you would typically:
        // 1. Update user subscription status in local storage or state management
        // 2. Send analytics events
        // 3. Trigger any post-payment workflows
        // 4. Store subscription details

        // Example: Store subscription in localStorage
        if (data.userPubkey && data.planType) {
            const subscriptionData = {
                orderId: data.orderId,
                userPubkey: data.userPubkey,
                planType: data.planType,
                status: 'active',
                activatedAt: new Date().toISOString(),
                // Calculate next billing date
                nextBilling: data.planType === 'monthly'
                    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            };

            localStorage.setItem(`subscription_${data.userPubkey}`, JSON.stringify(subscriptionData));
            console.log('Subscription stored:', subscriptionData);
        }
    };

    const handleFailedPayment = async (data: {
        orderId: string | null;
        userPubkey: string | null;
        planType: string | null;
        status: string | null;
    }) => {
        console.log('Processing failed payment:', data);

        // Handle failed payments
        // 1. Log the failure
        // 2. Update any pending payment status
        // 3. Send failure analytics

        if (data.userPubkey) {
            const failureData = {
                orderId: data.orderId,
                userPubkey: data.userPubkey,
                planType: data.planType,
                status: data.status,
                failedAt: new Date().toISOString()
            };

            // Store failure for retries or debugging
            const failures = JSON.parse(localStorage.getItem('payment_failures') || '[]');
            failures.push(failureData);
            localStorage.setItem('payment_failures', JSON.stringify(failures));
        }
    };

    // Simple webhook response for Zaprite
    return (
        <div style={{
            fontFamily: 'Arial, sans-serif',
            padding: '20px',
            textAlign: 'center',
            backgroundColor: '#f5f5f5',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                maxWidth: '500px',
                width: '100%'
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    margin: '0 auto 20px',
                    borderRadius: '50%',
                    backgroundColor: status === 'success' ? '#10B981' : status === 'error' ? '#EF4444' : '#6B7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {status === 'processing' && (
                        <div style={{
                            width: '24px',
                            height: '24px',
                            border: '3px solid #ffffff',
                            borderTop: '3px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                    )}
                    {status === 'success' && (
                        <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                    {status === 'error' && (
                        <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                </div>

                <h2 style={{
                    margin: '0 0 16px',
                    color: '#111827',
                    fontSize: '24px',
                    fontWeight: 'bold'
                }}>
                    {status === 'processing' && 'Processing Webhook'}
                    {status === 'success' && 'Webhook Processed'}
                    {status === 'error' && 'Webhook Error'}
                </h2>

                <p style={{
                    margin: '0',
                    color: '#6B7280',
                    fontSize: '16px'
                }}>
                    {message}
                </p>

                {searchParams.get('redirect') === 'true' && status === 'success' && (
                    <p style={{
                        margin: '20px 0 0',
                        color: '#6B7280',
                        fontSize: '14px'
                    }}>
                        Redirecting to success page...
                    </p>
                )}
            </div>

            <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default PaymentWebhook; 