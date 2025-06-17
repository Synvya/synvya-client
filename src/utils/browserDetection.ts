export type BrowserType = 'chrome' | 'firefox' | 'safari' | 'edge' | 'unknown';

export const detectBrowser = (): BrowserType => {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('firefox')) {
        return 'firefox';
    } else if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
        return 'chrome';
    } else if (userAgent.includes('edg')) {
        return 'edge';
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
        return 'safari';
    }

    return 'unknown';
};

export const getExtensionRecommendations = (browserType: BrowserType) => {
    switch (browserType) {
        case 'chrome':
        case 'edge':
        case 'unknown': // Default to Chrome-based recommendations
            return {
                extensions: [
                    {
                        name: 'Flamingo',
                        url: 'https://chromewebstore.google.com/detail/flamingo-%E2%80%93-nostr-extensio/alkiaengfedemppafkallgifcmkldohe'
                    },
                    {
                        name: 'nos2x',
                        url: 'https://chromewebstore.google.com/detail/nos2x/kpgefcfmnafjgpblomihpgmejjdanjjp'
                    },
                    {
                        name: 'Alby',
                        url: 'https://chromewebstore.google.com/detail/alby-bitcoin-wallet-for-l/iokeahhehimjnekafflcihljlcjccdbe'
                    }
                ]
            };
        case 'firefox':
            return {
                extensions: [
                    {
                        name: 'nos2x-fox',
                        url: 'https://addons.mozilla.org/en-GB/firefox/addon/nos2x-fox/'
                    },
                    {
                        name: 'Alby',
                        url: 'https://addons.mozilla.org/en-GB/firefox/addon/alby/'
                    }
                ]
            };
        case 'safari':
            return {
                extensions: [
                    {
                        name: 'Nostash',
                        url: 'https://apps.apple.com/us/app/nostash/id6744309333'
                    }
                ]
            };
        default:
            return {
                extensions: []
            };
    }
}; 