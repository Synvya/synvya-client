
import React, { createContext, useContext, useReducer, useEffect } from 'react';

interface NostrAuthState {
  isAuthenticated: boolean;
  publicKey: string | null;
  isLoading: boolean;
  error: string | null;
  hasNostrExtension: boolean;
}

type NostrAuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_AUTHENTICATED'; payload: { publicKey: string } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_EXTENSION_STATUS'; payload: boolean }
  | { type: 'LOGOUT' };

const initialState: NostrAuthState = {
  isAuthenticated: false,
  publicKey: null,
  isLoading: false,
  error: null,
  hasNostrExtension: false,
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
        isLoading: false,
        error: null 
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_EXTENSION_STATUS':
      return { ...state, hasNostrExtension: action.payload };
    case 'LOGOUT':
      return { ...initialState, hasNostrExtension: state.hasNostrExtension };
    default:
      return state;
  }
};

interface NostrAuthContextType extends NostrAuthState {
  signIn: () => Promise<void>;
  signUp: () => Promise<void>;
  logout: () => void;
  checkNostrExtension: () => void;
}

const NostrAuthContext = createContext<NostrAuthContextType | undefined>(undefined);

export const NostrAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(nostrAuthReducer, initialState);

  const checkNostrExtension = () => {
    const hasExtension = typeof window !== 'undefined' && 'nostr' in window;
    dispatch({ type: 'SET_EXTENSION_STATUS', payload: hasExtension });
    console.log('Nostr extension check:', hasExtension);
    return hasExtension;
  };

  useEffect(() => {
    checkNostrExtension();
  }, []);

  const signIn = async () => {
    console.log('Attempting sign in...');
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      if (!checkNostrExtension()) {
        throw new Error('Nostr browser extension not found. Please install nos2x, Alby, or another NIP-07 compatible extension.');
      }

      // @ts-ignore - window.nostr is added by browser extension
      const publicKey = await window.nostr.getPublicKey();
      console.log('Got public key:', publicKey);
      
      dispatch({ type: 'SET_AUTHENTICATED', payload: { publicKey } });
    } catch (error) {
      console.error('Sign in error:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Sign in failed' });
    }
  };

  const signUp = async () => {
    console.log('Attempting sign up...');
    // For now, sign up uses the same flow as sign in
    await signIn();
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
