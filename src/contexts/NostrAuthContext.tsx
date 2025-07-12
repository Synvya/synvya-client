import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { nostrService, Profile } from '../lib/nostr';

interface NostrAuthState {
  isAuthenticated: boolean;
  publicKey: string | null;
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  hasNostrExtension: boolean;
  isCheckingExtension: boolean;
  extensionChecked: boolean; // New flag to track if extension has been checked
  autoAuthAttempted: boolean; // New flag to track if auto-auth has been attempted
}

type NostrAuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_AUTHENTICATED'; payload: { publicKey: string; profile?: Profile } }
  | { type: 'SET_PROFILE'; payload: Profile }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_EXTENSION_STATUS'; payload: boolean }
  | { type: 'SET_CHECKING_EXTENSION'; payload: boolean }
  | { type: 'SET_EXTENSION_CHECKED'; payload: boolean } // New action
  | { type: 'SET_AUTO_AUTH_ATTEMPTED'; payload: boolean } // New action
  | { type: 'LOGOUT' };

const initialState: NostrAuthState = {
  isAuthenticated: false,
  publicKey: null,
  profile: null,
  isLoading: false,
  error: null,
  hasNostrExtension: false,
  isCheckingExtension: true,
  extensionChecked: false, // Initialize as false
  autoAuthAttempted: false, // Initialize as false
};

const nostrAuthReducer = (state: NostrAuthState, action: NostrAuthAction): NostrAuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: null };
    case 'SET_AUTHENTICATED':
      return {
        ...state,
        isAuthenticated: true,
        publicKey: action.payload.publicKey,
        profile: action.payload.profile || null,
        isLoading: false,
        error: null
      };
    case 'SET_PROFILE':
      return { ...state, profile: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_EXTENSION_STATUS':
      return { ...state, hasNostrExtension: action.payload };
    case 'SET_CHECKING_EXTENSION':
      return { ...state, isCheckingExtension: action.payload };
    case 'SET_EXTENSION_CHECKED':
      return { ...state, extensionChecked: action.payload };
    case 'SET_AUTO_AUTH_ATTEMPTED':
      return { ...state, autoAuthAttempted: action.payload };
    case 'LOGOUT':
      return {
        ...initialState,
        hasNostrExtension: state.hasNostrExtension,
        isCheckingExtension: false,
        extensionChecked: state.extensionChecked,
        autoAuthAttempted: false // Reset auto-auth flag on logout
      };
    default:
      return state;
  }
};

interface NostrAuthContextType extends NostrAuthState {
  signIn: () => Promise<void>;
  signUp: () => Promise<void>;
  logout: () => void;
  updateProfile: (
    profileData: {
      name?: string;
      display_name?: string;
      about?: string;
      picture?: string;
      banner?: string;
      website?: string;
      nip05?: string;
      bot?: boolean;
    },
    businessData?: {
      email?: string;
      phone?: string;
      location?: string;
      businessType?: string;
      categories?: string[];
    }
  ) => Promise<void>;
  refreshProfile: () => Promise<void>;
  checkNostrExtension: () => boolean;
}

const NostrAuthContext = createContext<NostrAuthContextType | undefined>(undefined);

export const NostrAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(nostrAuthReducer, initialState);

  const checkNostrExtension = React.useCallback(() => {
    // Only check once per session
    if (state.extensionChecked) {
      console.log('Extension already checked this session:', state.hasNostrExtension);
      return state.hasNostrExtension;
    }

    dispatch({ type: 'SET_CHECKING_EXTENSION', payload: true });

    // Check immediately
    const hasExtension = typeof window !== 'undefined' && 'nostr' in window;
    dispatch({ type: 'SET_EXTENSION_STATUS', payload: hasExtension });
    dispatch({ type: 'SET_EXTENSION_CHECKED', payload: true });
    console.log('Nostr extension check (first time):', hasExtension);

    // If not found, wait a bit and check again (extensions load async)
    if (!hasExtension) {
      setTimeout(() => {
        const hasExtensionDelayed = typeof window !== 'undefined' && 'nostr' in window;
        dispatch({ type: 'SET_EXTENSION_STATUS', payload: hasExtensionDelayed });
        dispatch({ type: 'SET_CHECKING_EXTENSION', payload: false });
        console.log('Nostr extension check (delayed):', hasExtensionDelayed);
      }, 2000);
    } else {
      dispatch({ type: 'SET_CHECKING_EXTENSION', payload: false });
    }

    return hasExtension;
  }, [state.extensionChecked, state.hasNostrExtension]);

  // Initialize nostr service on mount
  useEffect(() => {
    nostrService.initialize();
    checkNostrExtension();
  }, [checkNostrExtension]);

  const signIn = async () => {
    console.log('Attempting sign in...');
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      if (!checkNostrExtension()) {
        throw new Error('Nostr browser extension not found. Please install nos2x, Alby, or another NIP-07 compatible extension.');
      }

      // Get public key from extension
      const publicKey = await nostrService.getPublicKey();
      console.log('Got public key:', publicKey);

      // Try to load existing profile
      const profile = await nostrService.getProfile(publicKey);
      console.log('Loaded profile:', profile);

      dispatch({
        type: 'SET_AUTHENTICATED',
        payload: { publicKey, profile: profile || undefined }
      });
    } catch (error) {
      console.error('Sign in error:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Sign in failed' });
    }
  };



  const signUp = async () => {
    console.log('Attempting sign up...');
    // For Nostr, sign up is the same as sign in - just connect with extension
    await signIn();
  };

  const updateProfile = async (
    profileData: {
      name?: string;
      display_name?: string;
      about?: string;
      picture?: string;
      banner?: string;
      website?: string;
      nip05?: string;
      bot?: boolean;
    },
    businessData?: {
      email?: string;
      phone?: string;
      location?: string;
      businessType?: string;
      categories?: string[];
    }
  ) => {
    if (!state.publicKey) {
      throw new Error('Not authenticated');
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      await nostrService.updateProfile(profileData, businessData || {});

      // Refresh profile from relays
      await refreshProfile();
    } catch (error) {
      console.error('Profile update error:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Profile update failed' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const refreshProfile = async () => {
    if (!state.publicKey) return;

    try {
      const profile = await nostrService.getProfile(state.publicKey);
      if (profile) {
        dispatch({ type: 'SET_PROFILE', payload: profile });
      }
    } catch (error) {
      console.error('Profile refresh error:', error);
    }
  };

  const logout = () => {
    console.log('Logging out...');
    dispatch({ type: 'LOGOUT' });
  };

  const value: NostrAuthContextType = {
    ...state,
    signIn,
    signUp,
    logout,
    updateProfile,
    refreshProfile,
    checkNostrExtension,
  };

  return (
    <NostrAuthContext.Provider value={value}>
      {children}
    </NostrAuthContext.Provider>
  );
};

export const useNostrAuth = (): NostrAuthContextType => {
  const context = useContext(NostrAuthContext);
  if (context === undefined) {
    throw new Error('useNostrAuth must be used within a NostrAuthProvider');
  }
  return context;
};
