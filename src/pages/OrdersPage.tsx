import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNostrAuth } from '@/contexts/NostrAuthContext';
import { useSubscription, hasValidSubscription } from '@/hooks/useSubscription';
import NavHeader from '@/components/NavHeader';
import { getApiUrl } from '@/utils/apiConfig';

interface OrderInfo {
    id: string;
    paidAt: string;
    totalAmount: number;
    currency: string;
    label: string;
    receiptPdfUrl: string;
    status: string;
}

const OrdersPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, publicKey, isLoading: authLoading } = useNostrAuth();
    const { subscription } = useSubscription(publicKey || undefined);
    const [orders, setOrders] = useState<OrderInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check if user has valid subscription
    const hasValidSub = hasValidSubscription(subscription);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/signin');
        }
    }, [isAuthenticated, authLoading, navigate]);

    const fetchOrders = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Step 1: Get the list of order IDs for this user using API configuration utility
            const functionUrl = getApiUrl('getUserOrders');

            const orderIdsResponse = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ publicKey }),
            });

            if (!orderIdsResponse.ok) {
                throw new Error('Failed to fetch order IDs');
            }

            const orderIdsData = await orderIdsResponse.json();
            const orderIds = orderIdsData.orderIds || [];

            if (orderIds.length === 0) {
                setOrders([]);
                setIsLoading(false);
                return;
            }

            // Step 2: Fetch detailed information for each order using API configuration utility
            const orderPromises = orderIds.map(async (orderId: string) => {
                const orderUrl = `${getApiUrl('getOrder')}?orderId=${orderId}`;

                const orderResponse = await fetch(orderUrl);
                if (orderResponse.ok) {
                    return await orderResponse.json();
                }
                console.error(`Failed to fetch order ${orderId}`);
                return null;
            });

            const orderResults = await Promise.all(orderPromises);
            const validOrders = orderResults.filter((order): order is OrderInfo => order !== null);

            // Sort orders by date (newest first)
            validOrders.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());

            setOrders(validOrders);
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch orders');
        } finally {
            setIsLoading(false);
        }
    }, [publicKey]);

    // Fetch orders when component mounts
    useEffect(() => {
        if (isAuthenticated && publicKey) {
            fetchOrders();
        }
    }, [isAuthenticated, publicKey, fetchOrders]);

    const formatDate = (dateString: string): string => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
        });
    };

    const formatAmount = (amount: number, currency: string): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount / 100); // Convert cents to dollars
    };

    // Show loading state
    if (authLoading || (!isAuthenticated && !error)) {
        return (
            <div className="min-h-screen bg-[#F6F6F9]">
                <NavHeader />
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#49BB5B] mx-auto mb-4"></div>
                            <p className="text-[#01013C]">Loading...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F6F6F9]">
            <NavHeader />

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h1 className="text-3xl font-bold text-[#01013C] mb-8">
                        Order History
                    </h1>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#49BB5B] mx-auto mb-4"></div>
                            <p className="text-[#01013C]">Loading orders...</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 text-lg">No orders found</p>
                            <p className="text-gray-400 text-sm mt-2">Your completed orders will appear here</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-gray-200">
                                        <th className="text-left py-4 px-4 font-semibold text-[#01013C]">Date</th>
                                        <th className="text-left py-4 px-4 font-semibold text-[#01013C]">Amount</th>
                                        <th className="text-left py-4 px-4 font-semibold text-[#01013C]">Currency</th>
                                        <th className="text-left py-4 px-4 font-semibold text-[#01013C]">Label</th>
                                        <th className="text-left py-4 px-4 font-semibold text-[#01013C]">Receipt</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-4 px-4 text-[#01013C]">
                                                {formatDate(order.paidAt)}
                                            </td>
                                            <td className="py-4 px-4 text-[#01013C]">
                                                {formatAmount(order.totalAmount, order.currency)}
                                            </td>
                                            <td className="py-4 px-4 text-[#01013C] uppercase">
                                                {order.currency}
                                            </td>
                                            <td className="py-4 px-4 text-[#01013C]">
                                                {order.label}
                                            </td>
                                            <td className="py-4 px-4">
                                                {order.receiptPdfUrl ? (
                                                    <a
                                                        href={order.receiptPdfUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center px-3 py-1 bg-[#49BB5B] text-white text-sm rounded-lg hover:bg-[#3DA149] transition-colors"
                                                    >
                                                        📄 View PDF
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">Not available</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-gray-200">
                        {hasValidSub ? (
                            <button
                                onClick={() => navigate('/form')}
                                className="px-6 py-2 bg-gray-100 text-[#01013C] rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                ← Back to Form
                            </button>
                        ) : (
                            <div className="text-center">
                                <p className="text-gray-500 text-sm mb-4">
                                    You need an active subscription to access the business form.
                                </p>
                                <button
                                    onClick={() => navigate('/payment')}
                                    className="px-6 py-2 bg-[#49BB5B] text-white rounded-lg hover:bg-[#3DA149] transition-colors"
                                >
                                    Subscribe Now
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrdersPage; 