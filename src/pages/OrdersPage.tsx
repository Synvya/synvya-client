import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNostrAuth } from '@/contexts/NostrAuthContext';
import NavHeader from '@/components/NavHeader';

const OrdersPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading } = useNostrAuth();

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/signin');
        }
    }, [isAuthenticated, authLoading, navigate]);

    // Show loading state
    if (authLoading || (!isAuthenticated)) {
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

                    <div className="text-center py-8">
                        <div className="mb-6">
                            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 text-lg mb-2">Order history is not available</p>
                        <p className="text-gray-400 text-sm">
                            We no longer track payment orders as the service is now free to use.
                        </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <button
                            onClick={() => navigate('/form')}
                            className="px-6 py-2 bg-gray-100 text-[#01013C] rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            ← Back to Form
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrdersPage; 