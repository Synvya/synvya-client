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

// Wait for runtime environment to load (with timeout)
const waitForRuntimeEnv = async (maxWait = 5000): Promise<void> => {
    const startTime = Date.now();

    while (!window.runtimeEnv && (Date.now() - startTime) < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!window.runtimeEnv) {
        throw new Error(`Runtime environment not loaded after ${maxWait}ms`);
    }
};

// Get API URLs - uses runtime config in production, local URLs in development
export const getApiUrls = () => {
    if (isDev) {
        console.log('Development mode: using local URLs');
        return LOCAL_URLS;
    }

    // Production - use Lambda function URLs from runtime config
    const config = window.runtimeEnv;
    if (!config) {
        console.error('runtimeEnv not found in production! Check if runtime-env.js is loaded correctly');
        console.log('Available on window:', Object.keys(window));
        // In production, we should not fall back to localhost
        throw new Error('Runtime configuration not found. Please ensure runtime-env.js is loaded.');
    }

    console.log('Production mode: using Lambda URLs from runtime config', config);

    return {
        health: config.healthUrl,
        recordTermsAcceptance: config.recordTermsAcceptanceUrl,
        checkUserExists: config.checkUserExistsUrl,
        // Future endpoints can be added here
    };
};

// Async version that waits for runtime config to load
export const getApiUrlsAsync = async () => {
    if (isDev) {
        console.log('Development mode: using local URLs');
        return LOCAL_URLS;
    }

    // Wait for runtime environment to load in production
    await waitForRuntimeEnv();
    return getApiUrls();
};

// Helper function to get a specific API URL
export const getApiUrl = (endpoint: keyof ReturnType<typeof getApiUrls>) => {
    return getApiUrls()[endpoint];
}; 