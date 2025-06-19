// API configuration utility for Lambda function URLs
// Handles both production (runtime-env.js) and local development (Netlify functions)
//
// MIGRATION NOTES:
// - Production now uses AWS Lambda Function URLs instead of Netlify Functions
// - Function URLs are loaded via /runtime-env.js which sets window.runtimeEnv
// - Local development still uses Netlify dev server (localhost:8888)
// - All 6 functions have been migrated: checkSubscription, createZapriteOrder, 
//   paymentWebhook, getOrder, getUserOrders, checkContact

declare global {
    interface Window {
        runtimeEnv?: {
            paymentWebhookUrl?: string;
            getOrderUrl?: string;
            getUserOrdersUrl?: string;
            checkSubscriptionUrl?: string;
            createZapriteOrderUrl?: string;
            checkContactUrl?: string;
        };
    }
}

const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

// Local development URLs (Netlify dev server)
const LOCAL_URLS = {
    checkSubscription: 'http://localhost:8888/.netlify/functions/check-subscription',
    createZapriteOrder: 'http://localhost:8888/.netlify/functions/create-zaprite-order',
    paymentWebhook: 'http://localhost:8888/.netlify/functions/payment-webhook',
    getOrder: 'http://localhost:8888/.netlify/functions/get-order',
    getUserOrders: 'http://localhost:8888/.netlify/functions/get-user-orders',
    checkContact: 'http://localhost:8888/.netlify/functions/check-contact',
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
        checkSubscription: config.checkSubscriptionUrl || LOCAL_URLS.checkSubscription,
        createZapriteOrder: config.createZapriteOrderUrl || LOCAL_URLS.createZapriteOrder,
        paymentWebhook: config.paymentWebhookUrl || LOCAL_URLS.paymentWebhook,
        getOrder: config.getOrderUrl || LOCAL_URLS.getOrder,
        getUserOrders: config.getUserOrdersUrl || LOCAL_URLS.getUserOrders,
        checkContact: config.checkContactUrl || LOCAL_URLS.checkContact,
    };
};

// Helper function to get a specific API URL
export const getApiUrl = (endpoint: keyof ReturnType<typeof getApiUrls>) => {
    return getApiUrls()[endpoint];
}; 