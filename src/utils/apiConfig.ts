// API configuration utility for serverless functions
// Handles both production and local development environments

declare global {
    interface Window {
        runtimeEnv?: {
            healthUrl?: string;
            recordTermsAcceptanceUrl?: string;
            checkUserExistsUrl?: string;
            // Future API endpoints can be added here
            [key: string]: string;
        };
    }
}

const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

// Local development URLs (Netlify dev server)
const LOCAL_URLS = {
    health: 'http://localhost:8888/.netlify/functions/health',
    recordTermsAcceptance: 'http://localhost:8888/.netlify/functions/record-terms-acceptance',
    checkUserExists: 'http://localhost:8888/.netlify/functions/check-user-exists',
    // Future local endpoints can be added here
};

// Get API URLs - uses runtime config in production, local URLs in development
export const getApiUrls = () => {
    if (isDev) {
        return LOCAL_URLS;
    }

    // Production - use Lambda function URLs from runtime config
    const config = window.runtimeEnv;
    if (!config) {
        console.warn('runtimeEnv not found, falling back to local URLs');
        return LOCAL_URLS;
    }

    return {
        health: config.healthUrl || LOCAL_URLS.health,
        recordTermsAcceptance: config.recordTermsAcceptanceUrl || LOCAL_URLS.recordTermsAcceptance,
        checkUserExists: config.checkUserExistsUrl || LOCAL_URLS.checkUserExists,
        // Future endpoints can be added here
        ...LOCAL_URLS,
    };
};

// Helper function to get a specific API URL
export const getApiUrl = (endpoint: keyof ReturnType<typeof getApiUrls>) => {
    return getApiUrls()[endpoint];
}; 