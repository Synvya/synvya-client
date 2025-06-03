import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavHeader from '@/components/NavHeader';
import PrimaryButton from '@/components/PrimaryButton';
import SecondaryButton from '@/components/SecondaryButton';
import FilePicker from '@/components/FilePicker';
import CountrySelect from '@/components/CountrySelect';
import StateSelect from '@/components/StateSelect';
import { useNostrAuth } from '@/contexts/NostrAuthContext';

interface FormData {
  name: string;
  displayName: string;
  about: string;
  street: string;
  city: string;
  zipCode: string;
  state: string;
  country: string;
  profilePicture: File | null;
  bannerPicture: File | null;
  website: string;
  categories: string;
  csvFile: File | null;
  email: string;
  phone: string;
}

interface ProfileData {
  about: string;
  banner: string;
  bot: boolean;
  city: string;
  country: string;
  display_name: string;
  email: string;
  hashtags: string[];
  locations: string[];
  name: string;
  namespace: string;
  nip05: string;
  picture: string;
  phone: string;
  profile_url: string;
  public_key: string;
  profile_type: string;
  state: string;
  street: string;
  website: string;
  zip_code: string;
}

const FormPage: React.FC = () => {
  const navigate = useNavigate();
  const { publicKey, isAuthenticated } = useNostrAuth();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    displayName: '',
    about: '',
    street: '',
    city: '',
    zipCode: '',
    state: '',
    country: '',
    profilePicture: null,
    bannerPicture: null,
    website: '',
    categories: '',
    csvFile: null,
    email: '',
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile data when component mounts and user is authenticated
  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated || !publicKey) {
        console.log('User not authenticated, skipping profile fetch');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/profile/${publicKey}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch profile: ${response.status} ${response.statusText}`);
        }

        const profileData: ProfileData = await response.json();
        console.log('Fetched profile data:', profileData);

        // Map profile data to form data
        setFormData(prevData => ({
          ...prevData,
          name: profileData.name || '',
          displayName: profileData.display_name || '',
          about: profileData.about || '',
          street: profileData.street || '',
          city: profileData.city || '',
          zipCode: profileData.zip_code || '',
          state: profileData.state || '',
          country: profileData.country || '',
          website: profileData.website || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          // Convert hashtags array to comma-separated string for categories field
          categories: profileData.hashtags ? profileData.hashtags.join(', ') : '',
        }));

      } catch (error) {
        console.error('Error fetching profile:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, publicKey]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: keyof FormData, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);

    // Pass form data to delegation page via route state
    // After delegation is complete, this data will be used to save the profile
    navigate('/delegation', {
      state: {
        profileData: {
          public_key: publicKey,
          name: formData.name,
          display_name: formData.displayName,
          about: formData.about,
          street: formData.street,
          city: formData.city,
          zip_code: formData.zipCode,
          state: formData.state,
          country: formData.country,
          website: formData.website,
          email: formData.email,
          phone: formData.phone,
          // Convert categories string to hashtags array
          hashtags: formData.categories.split(',').map(cat => cat.trim()).filter(cat => cat.length > 0),
        }
      }
    });
  };

  const handlePopulateSquare = () => {
    console.log('Populate with Square clicked');
    // TODO: Implement Square integration
  };

  const handlePopulateShopify = () => {
    console.log('Populate with Shopify clicked');
    // TODO: Implement Shopify integration
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F6F9]">
        <NavHeader />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9F7AEA] mx-auto mb-4"></div>
              <p className="text-[#01013C]">Loading your profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F6F9]">
      <NavHeader />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-[#01013C] text-center mb-8">
            Business Profile
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

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

            {/* Address Fields */}
            <div>
              <label className="block text-sm font-medium text-[#01013C] mb-2">
                Street Address
              </label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => handleInputChange('street', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#9F7AEA] focus:outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#01013C] mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#9F7AEA] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#01013C] mb-2">
                  Zip Code
                </label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#9F7AEA] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#01013C] mb-2">
                  Country
                </label>
                <CountrySelect
                  value={formData.country}
                  onChange={(value) => {
                    handleInputChange('country', value);
                    // Reset state if country changes from US
                    if (value !== 'US') {
                      handleInputChange('state', '');
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#01013C] mb-2">
                  State / Province
                </label>
                {formData.country === 'US' ? (
                  <StateSelect
                    value={formData.state}
                    onChange={(value) => handleInputChange('state', value)}
                  />
                ) : (
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#9F7AEA] focus:outline-none transition-colors"
                    placeholder="State/Province/Region"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#01013C] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#9F7AEA] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#01013C] mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#9F7AEA] focus:outline-none transition-colors"
                />
              </div>
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
                disabled={isLoading}
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
