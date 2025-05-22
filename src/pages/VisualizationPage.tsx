
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNostrAuth } from '@/contexts/NostrAuthContext';
import NavHeader from '@/components/NavHeader';
import SecondaryButton from '@/components/SecondaryButton';

const VisualizationPage: React.FC = () => {
  const navigate = useNavigate();
  const { publicKey } = useNostrAuth();

  const handleBack = () => {
    navigate('/form');
  };

  return (
    <div className="min-h-screen bg-[#F6F6F9]">
      <NavHeader />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#01013C] mb-4">
            Your Storefront Preview
          </h1>
          <p className="text-gray-600">
            This is how your storefront will appear at nosta.me/{publicKey?.slice(0, 16)}...
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="relative w-full" style={{ paddingBottom: '66.67%' }}>
            <iframe
              src={`https://nosta.me/${publicKey || 'demo'}`}
              className="absolute inset-0 w-full h-full border-2 border-gray-200 rounded-xl"
              title="Storefront Preview"
            />
          </div>
        </div>

        <div className="text-center">
          <SecondaryButton onClick={handleBack}>
            Back to Form
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
};

export default VisualizationPage;
