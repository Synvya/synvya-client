import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNostrAuth } from '@/contexts/NostrAuthContext';
import NavHeader from '@/components/NavHeader';
import { nostrService } from '@/lib/nostr';

// Country list with US first
const COUNTRIES = [
  'United States',
  'Afghanistan',
  'Albania',
  'Algeria',
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahrain',
  'Bangladesh',
  'Belarus',
  'Belgium',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Brazil',
  'Bulgaria',
  'Cambodia',
  'Canada',
  'Chile',
  'China',
  'Colombia',
  'Costa Rica',
  'Croatia',
  'Czech Republic',
  'Denmark',
  'Dominican Republic',
  'Ecuador',
  'Egypt',
  'Estonia',
  'Finland',
  'France',
  'Georgia',
  'Germany',
  'Greece',
  'Guatemala',
  'Honduras',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Israel',
  'Italy',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kuwait',
  'Latvia',
  'Lebanon',
  'Lithuania',
  'Luxembourg',
  'Malaysia',
  'Mexico',
  'Morocco',
  'Netherlands',
  'New Zealand',
  'Nigeria',
  'Norway',
  'Pakistan',
  'Panama',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Qatar',
  'Romania',
  'Russia',
  'Saudi Arabia',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'South Africa',
  'South Korea',
  'Spain',
  'Sweden',
  'Switzerland',
  'Thailand',
  'Turkey',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'Uruguay',
  'Venezuela',
  'Vietnam'
];

// US States
const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

interface FormData {
  name: string;
  displayName: string;
  about: string;
  businessType: string;
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

const FormPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, publicKey, profile, updateProfile, isLoading: authLoading, refreshProfile } = useNostrAuth();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    displayName: '',
    about: '',
    businessType: 'business',
    street: '',
    city: '',
    zipCode: '',
    state: '',
    country: 'United States',
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [existingPictureUrl, setExistingPictureUrl] = useState<string | null>(null);
  const [existingBannerUrl, setExistingBannerUrl] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/signin');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Load profile data when available
  useEffect(() => {
    if (profile) {
      loadProfileIntoForm(profile);
    }
  }, [profile]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear any existing messages
    setError(null);
    setSuccessMessage(null);
  };

  const handleFileChange = (field: keyof FormData, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleCountryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      country: value,
      // Reset state when country changes
      state: value === 'United States' ? prev.state : ''
    }));
    setError(null);
    setSuccessMessage(null);
  };

  // Normalize website URL to https://www.domain.name format
  const normalizeWebsiteUrl = (url: string): string => {
    if (!url.trim()) return '';

    let normalizedUrl = url.trim();

    // Remove any trailing slashes
    normalizedUrl = normalizedUrl.replace(/\/+$/, '');

    // If it already has a protocol, return as is (user knows what they're doing)
    if (normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://')) {
      return normalizedUrl;
    }

    // If it doesn't start with www., add it
    if (!normalizedUrl.startsWith('www.')) {
      normalizedUrl = `www.${normalizedUrl}`;
    }

    // Add https:// protocol
    normalizedUrl = `https://${normalizedUrl}`;

    return normalizedUrl;
  };

  const handleWebsiteChange = (value: string) => {
    setFormData(prev => ({ ...prev, website: value }));
    // Clear any existing messages
    setError(null);
    setSuccessMessage(null);
  };

  const handleWebsiteBlur = () => {
    // Normalize the website URL when user leaves the field
    if (formData.website) {
      const normalized = normalizeWebsiteUrl(formData.website);
      if (normalized !== formData.website) {
        setFormData(prev => ({ ...prev, website: normalized }));
      }
    }
  };

  const handleRefreshProfile = async () => {
    if (!publicKey) return;

    setIsLoading(true);
    try {
      console.log('Refreshing profile from Nostr...');
      await refreshProfile();

      // Force reload the form data by calling the profile loading logic directly
      const refreshedProfile = await nostrService.getProfile(publicKey);
      console.log('Refreshed profile received:', refreshedProfile);

      if (refreshedProfile) {
        loadProfileIntoForm(refreshedProfile);
      }

      setSuccessMessage('Profile refreshed from Nostr network!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      setError('Failed to refresh profile from Nostr network');
    } finally {
      setIsLoading(false);
    }
  };

  // Extract profile loading logic into a separate function
  const loadProfileIntoForm = (profileData: typeof profile) => {
    if (!profileData) return;

    console.log('Loading profile data into form:', profileData);

    // Store existing image URLs
    setExistingPictureUrl(profileData.picture || null);
    setExistingBannerUrl(profileData.banner || null);

    // Parse location into address components
    let street = '', city = '', state = '', zipCode = '', country = '';
    if (profileData.location) {
      console.log('Original location:', profileData.location);
      const locationParts = profileData.location.split(',').map(part => part.trim());
      console.log('Location parts:', locationParts);

      // Handle location parsing based on the number of components
      // We always store in order: street, city, state, zipCode, country
      if (locationParts.length >= 1) street = locationParts[0] || '';
      if (locationParts.length >= 2) city = locationParts[1] || '';
      if (locationParts.length >= 3) state = locationParts[2] || '';
      if (locationParts.length >= 4) zipCode = locationParts[3] || '';
      if (locationParts.length >= 5) country = locationParts[4] || '';

      console.log('Parsed address:', { street, city, state, zipCode, country });
    }

    // Extract business type - preserve existing value if not found in profile
    const businessType = profileData.businessType || formData.businessType;
    console.log('Business type from profile:', profileData.businessType);
    console.log('Current form business type:', formData.businessType);
    console.log('Final business type to use:', businessType);

    // Extract categories from 't' tags
    let categories = '';
    if (profileData.tags) {
      const categoryTags = profileData.tags
        .filter(tag => tag[0] === 't')
        .map(tag => tag[1])
        .filter(category => category);
      categories = categoryTags.join(', ');
      console.log('Categories from tags:', categories);
    }

    console.log('Setting form data with:', {
      name: profileData.name,
      displayName: profileData.display_name,
      about: profileData.about,
      businessType,
      street, city, state, zipCode, country,
      website: profileData.website,
      email: profileData.email,
      phone: profileData.phone,
      categories,
    });

    setFormData(prevData => ({
      ...prevData,
      name: profileData.name || '',
      displayName: profileData.display_name || '',
      about: profileData.about || '',
      businessType,
      street,
      city,
      state,
      zipCode,
      country,
      website: profileData.website || '',
      email: profileData.email || '',
      phone: profileData.phone || '',
      categories,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Upload images to blossom.band if provided
      let pictureUrl = '';
      let bannerUrl = '';

      if (formData.profilePicture) {
        try {
          setSuccessMessage('Uploading profile picture...');
          pictureUrl = await nostrService.uploadToBlossom(formData.profilePicture);
          console.log('Profile picture uploaded:', pictureUrl);
        } catch (error) {
          console.error('Profile picture upload failed:', error);
          setError(`Failed to upload profile picture: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return;
        }
      } else {
        // Preserve existing profile picture URL
        pictureUrl = existingPictureUrl || '';
      }

      if (formData.bannerPicture) {
        try {
          setSuccessMessage('Uploading banner image...');
          bannerUrl = await nostrService.uploadToBlossom(formData.bannerPicture);
          console.log('Banner uploaded:', bannerUrl);
        } catch (error) {
          console.error('Banner upload failed:', error);
          setError(`Failed to upload banner image: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return;
        }
      } else {
        // Preserve existing banner URL
        bannerUrl = existingBannerUrl || '';
      }

      setSuccessMessage('Saving profile...');

      // Construct the location string with zip code - always preserve structure
      const locationComponents = [
        formData.street.trim(),
        formData.city.trim(),
        formData.state.trim(),
        formData.zipCode.trim(),
        formData.country.trim()
      ];

      // Find the last non-empty component
      let lastIndex = -1;
      for (let i = locationComponents.length - 1; i >= 0; i--) {
        if (locationComponents[i]) {
          lastIndex = i;
          break;
        }
      }

      // Include all components up to the last non-empty one
      const location = lastIndex >= 0
        ? locationComponents.slice(0, lastIndex + 1).join(', ')
        : undefined;

      // Parse categories into individual tags
      const categories = formData.categories
        .split(',')
        .map(cat => cat.trim())
        .filter(cat => cat.length > 0);

      // Generate clean nip05 username from business name
      const cleanName = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '') // Remove spaces
        .substring(0, 20); // Limit length

      // Normalize website URL before saving
      const normalizedWebsite = normalizeWebsiteUrl(formData.website);

      // Prepare standard profile data (only standard Nostr fields)
      const profileData = {
        name: formData.name,
        display_name: formData.displayName,
        about: formData.about,
        website: normalizedWebsite,
        nip05: `${cleanName}@synvya.com`,
        bot: false,
        // Add uploaded image URLs
        picture: pictureUrl || undefined,
        banner: bannerUrl || undefined,
      };

      // Prepare business data for tags
      const businessData = {
        email: formData.email,
        phone: formData.phone,
        location,
        businessType: formData.businessType,
        categories,
      };

      console.log('Updating profile with data:', profileData);
      console.log('Business data for tags:', businessData);

      // Update profile using new structure
      await updateProfile(profileData, businessData);

      setSuccessMessage('Profile updated successfully on Nostr network!');

      // Redirect to visualization page after successful update
      setTimeout(() => {
        navigate('/visualization');
      }, 2000);

    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePopulateSquare = () => {
    console.log('Populate with Square clicked');
    setError('Square integration coming soon! For now, please fill out the form manually.');
  };

  const handlePopulateShopify = () => {
    console.log('Populate with Shopify clicked');
    setError('Shopify integration coming soon! For now, please fill out the form manually.');
  };

  // Show loading state
  if (authLoading || (!isAuthenticated && !error)) {
    return (
      <div className="min-h-screen bg-[#F6F6F9]">
        <NavHeader />
        <div className="max-w-2xl mx-auto px-4 py-8">
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

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-[#01013C] text-center mb-8">
            Business Profile
          </h1>

          <div className="flex justify-between items-center mb-6">
            <div className="flex-1"></div>
            <button
              type="button"
              onClick={handleRefreshProfile}
              disabled={isLoading}
              className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isLoading ? 'Refreshing...' : 'Refresh from Nostr'}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-green-600 text-sm">{successMessage}</p>
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
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#49BB5B] focus:outline-none transition-colors"
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
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#49BB5B] focus:outline-none transition-colors"
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
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#49BB5B] focus:outline-none transition-colors resize-none"
                placeholder="Tell us about your business..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#01013C] mb-2">
                Business Type
              </label>
              <select
                value={formData.businessType}
                onChange={(e) => handleInputChange('businessType', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#49BB5B] focus:outline-none transition-colors bg-white"
                required
              >
                <option value="business">Business</option>
                <option value="retail">Retail</option>
                <option value="restaurant">Restaurant</option>
                <option value="service">Service</option>
                <option value="entertainment">Entertainment</option>
                <option value="other">Other</option>
              </select>
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
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#49BB5B] focus:outline-none transition-colors"
                placeholder="123 Main Street"
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
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#49BB5B] focus:outline-none transition-colors"
                  placeholder="New York"
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
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#49BB5B] focus:outline-none transition-colors"
                  placeholder="10001"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#01013C] mb-2">
                  State
                </label>
                {formData.country === 'United States' ? (
                  <select
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#49BB5B] focus:outline-none transition-colors bg-white"
                  >
                    <option value="">Select a state...</option>
                    {US_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#49BB5B] focus:outline-none transition-colors"
                    placeholder="State/Province"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#01013C] mb-2">
                  Country
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#49BB5B] focus:outline-none transition-colors bg-white"
                  required
                >
                  {COUNTRIES.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#01013C] mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleWebsiteChange(e.target.value)}
                  onBlur={handleWebsiteBlur}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#49BB5B] focus:outline-none transition-colors"
                  placeholder="example.com or www.example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#01013C] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#49BB5B] focus:outline-none transition-colors"
                  placeholder="contact@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#01013C] mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#49BB5B] focus:outline-none transition-colors"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#01013C] mb-2">
                Business Categories
              </label>
              <input
                type="text"
                value={formData.categories}
                onChange={(e) => handleInputChange('categories', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#49BB5B] focus:outline-none transition-colors"
                placeholder="retail, electronics, gadgets"
              />
              <p className="text-sm text-gray-500 mt-1">Separate categories with commas</p>
            </div>

            {/* Integration Options */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-[#01013C] mb-4">
                External Integrations (Coming Soon)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={handlePopulateSquare}
                  className="flex items-center justify-center px-4 py-3 border-2 border-gray-300 rounded-xl hover:border-[#49BB5B] transition-colors text-gray-600"
                  disabled
                >
                  📊 Populate with Square
                </button>

                <button
                  type="button"
                  onClick={handlePopulateShopify}
                  className="flex items-center justify-center px-4 py-3 border-2 border-gray-300 rounded-xl hover:border-[#49BB5B] transition-colors text-gray-600"
                  disabled
                >
                  🛍️ Populate with Shopify
                </button>
              </div>
            </div>

            {/* Profile Images */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-[#01013C] mb-4">
                Profile Images
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#01013C] mb-2">
                    Profile Picture
                  </label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('profilePicture', e.target.files?.[0] || null)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#49BB5B] focus:outline-none transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#49BB5B] file:text-white hover:file:bg-[#3DA149]"
                    />
                    {formData.profilePicture ? (
                      <div className="relative">
                        <img
                          src={URL.createObjectURL(formData.profilePicture)}
                          alt="Profile preview"
                          className="w-24 h-24 object-cover rounded-xl border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleFileChange('profilePicture', null)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ) : existingPictureUrl ? (
                      <div className="relative">
                        <img
                          src={existingPictureUrl}
                          alt="Current profile picture"
                          className="w-24 h-24 object-cover rounded-xl border-2 border-gray-200"
                        />
                        <div className="absolute -bottom-1 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                          Current
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Square image recommended. Max 100MB.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#01013C] mb-2">
                    Banner Image
                  </label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('bannerPicture', e.target.files?.[0] || null)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#49BB5B] focus:outline-none transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#49BB5B] file:text-white hover:file:bg-[#3DA149]"
                    />
                    {formData.bannerPicture ? (
                      <div className="relative">
                        <img
                          src={URL.createObjectURL(formData.bannerPicture)}
                          alt="Banner preview"
                          className="w-full h-24 object-cover rounded-xl border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleFileChange('bannerPicture', null)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ) : existingBannerUrl ? (
                      <div className="relative">
                        <img
                          src={existingBannerUrl}
                          alt="Current banner image"
                          className="w-full h-24 object-cover rounded-xl border-2 border-gray-200"
                        />
                        <div className="absolute -bottom-1 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                          Current
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Wide banner image. Max 100MB.</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading || !formData.name.trim()}
                className="w-full bg-[#49BB5B] text-white font-semibold py-4 px-6 rounded-xl hover:bg-[#3DA149] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Updating Profile on Nostr...
                  </div>
                ) : (
                  'Save Profile to Nostr'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormPage;
