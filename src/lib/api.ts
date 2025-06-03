interface NostrHeaders {
    'X-Nostr-Pubkey': string;
    'X-Nostr-Signature': string;
    'X-Nostr-Timestamp': string;
}

interface NostrEvent {
    id?: string;
    kind: number;
    created_at: number;
    content: string;
    tags: string[][];
    pubkey: string;
    sig?: string;
}

interface ApiRequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
}

class ApiClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    }

    private async generateEventId(event: NostrEvent): Promise<string> {
        // Create the event array as per Nostr spec for ID generation
        const eventArray = [
            0, // version
            event.pubkey,
            event.created_at,
            event.kind,
            event.tags,
            event.content
        ];

        const eventJson = JSON.stringify(eventArray);

        // Create SHA256 hash
        const encoder = new TextEncoder();
        const data = encoder.encode(eventJson);

        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    private async generateNostrHeaders(publicKey: string): Promise<NostrHeaders> {
        if (!window.nostr) {
            throw new Error('Nostr extension not available');
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const message = `nostr-auth:${timestamp}`;

        try {
            // Create a simple event for authentication instead of using signMessage
            const authEvent: NostrEvent = {
                kind: 22242, // Nostr auth event kind
                created_at: timestamp,
                content: message,
                tags: [],
                pubkey: publicKey
            };

            // Add the event id
            authEvent.id = await this.generateEventId(authEvent);

            // Use signEvent which is more widely supported
            const signedEvent = await window.nostr.signEvent(authEvent);

            return {
                'X-Nostr-Pubkey': publicKey,
                'X-Nostr-Signature': signedEvent.sig,
                'X-Nostr-Timestamp': timestamp.toString()
            };
        } catch (error) {
            throw new Error(`Failed to sign authentication event: ${error}`);
        }
    }

    async authenticatedRequest(
        endpoint: string,
        publicKey: string,
        options: ApiRequestOptions = {}
    ): Promise<Response> {
        const { method = 'GET', body, headers = {} } = options;

        // Generate Nostr authentication headers
        const nostrHeaders = await this.generateNostrHeaders(publicKey);

        const requestHeaders = {
            'Content-Type': 'application/json',
            ...headers,
            ...nostrHeaders
        };

        console.log('API Request Debug:');
        console.log('- Endpoint:', endpoint);
        console.log('- Method:', method);
        console.log('- Body:', body);
        console.log('- Body kind:', body?.kind);
        console.log('- Headers:', requestHeaders);

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method,
            headers: requestHeaders,
            body: body ? JSON.stringify(body) : undefined,
        });

        return response;
    }
}

export const apiClient = new ApiClient(); 