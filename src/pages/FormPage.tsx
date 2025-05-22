
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavHeader from '@/components/NavHeader';
import PrimaryButton from '@/components/PrimaryButton';
import SecondaryButton from '@/components/SecondaryButton';
import FilePicker from '@/components/FilePicker';

interface FormData {
  name: string;
  displayName: string;
  about: string;
  profilePicture: File | null;
  bannerPicture: File | null;
  website: string;
  categories: string;
  csvFile: File | null;
}

const FormPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    displayName: '',
    about: '',
    profilePicture: null,
    bannerPicture: null,
    website: '',
    categories: '',
    csvFile: null,
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: keyof FormData, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    navigate('/visualization');
  };

  const handlePopulateSquare = () => {
    console.log('Populate with Square clicked');
    // TODO: Implement Square integration
  };

  const handlePopulateShopify = () => {
    console.log('Populate with Shopify clicked');
    // TODO: Implement Shopify integration
  };

  return (
    <div className="min-h-screen bg-[#F6F6F9]">
      <NavHeader />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-[#01013C] text-center mb-8">
            Merchant Profile
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#01013C] mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#9F7AEA] focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#01013C] mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#9F7AEA] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#01013C] mb-2">
                About
              </label>
              <textarea
                value={formData.about}
                onChange={(e) => handleInputChange('about', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#9F7AEA] focus:outline-none transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FilePicker
                label="Profile Picture"
                accept="image/*"
                onChange={(file) => handleFileChange('profilePicture', file)}
                placeholder="Choose profile image"
              />

              <FilePicker
                label="Banner Picture"
                accept="image/*"
                onChange={(file) => handleFileChange('bannerPicture', file)}
                placeholder="Choose banner image"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#01013C] mb-2">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#9F7AEA] focus:outline-none transition-colors"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#01013C] mb-2">
                Categories (comma separated list)
              </label>
              <input
                type="text"
                value={formData.categories}
                onChange={(e) => handleInputChange('categories', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#9F7AEA] focus:outline-none transition-colors"
                placeholder="electronics, accessories, home"
              />
            </div>

            <div>
              <FilePicker
                label="Products (load CSV file)"
                accept=".csv"
                onChange={(file) => handleFileChange('csvFile', file)}
                placeholder="Choose CSV file"
              />
              <p className="text-xs text-gray-500 mt-1">
                <a href="#" className="text-[#9F7AEA] hover:underline">
                  Click here for sample file
                </a>
              </p>
            </div>

            <div className="border-t pt-6">
              <p className="text-sm text-gray-600 mb-4">
                Log in to your Square or Shopify account on a separate tab before using the options below
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <SecondaryButton 
                  type="button"
                  onClick={handlePopulateSquare}
                  className="flex-1"
                >
                  Populate with Square
                </SecondaryButton>
                <SecondaryButton 
                  type="button"
                  onClick={handlePopulateShopify}
                  className="flex-1"
                >
                  Populate with Shopify
                </SecondaryButton>
              </div>
            </div>

            <div className="flex justify-center">
              <PrimaryButton 
                type="submit"
                className="px-12"
              >
                Preview Storefront
              </PrimaryButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormPage;
