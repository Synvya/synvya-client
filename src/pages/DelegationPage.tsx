import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NavHeader from '@/components/NavHeader';
import DelegationStep from '@/components/DelegationStep';
import { useNostrAuth } from '@/contexts/NostrAuthContext';
import { apiClient } from '@/lib/api';

interface ProfileData {
    public_key: string;
    name: string;
    display_name: string;
    about: string;
    street: string;
    city: string;
    zip_code: string;
    state: string;
    country: string;
    website: string;
    email: string;
    phone: string;
    hashtags: string[];
}

const DelegationPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { publicKey } = useNostrAuth();
    const profileData = location.state?.profileData as ProfileData;

    const handleComplete = async () => {
        // After successful delegation, save the profile data if it exists
        if (profileData && publicKey) {
            try {
                console.log('Saving profile data after delegation:', profileData);

                // Use authenticated request with Nostr headers
                const response = await apiClient.authenticatedRequest(
                    '/api/profile/',
                    publicKey,
                    {
                        method: 'POST',
                        body: profileData
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
                    throw new Error(`Failed to save profile: ${response.status} - ${errorData.detail || response.statusText}`);
                }

                const result = await response.json();
                console.log('Profile saved successfully:', result);

            } catch (error) {
                console.error('Error saving profile after delegation:', error);
                // Don't block navigation on profile save error
                // TODO: Show user notification about profile save failure
            }
        }

        // Navigate to visualization page after delegation (and optional profile save)
        navigate('/visualization');
    };

    const handleSkip = () => {
        // Allow user to skip delegation for now
        // Note: Profile data won't be saved if delegation is skipped
        navigate('/visualization');
    };

    return (
        <div className="min-h-screen bg-[#F6F6F9]">
            <NavHeader />
            <DelegationStep onComplete={handleComplete} onSkip={handleSkip} />
        </div>
    );
};

export default DelegationPage; 