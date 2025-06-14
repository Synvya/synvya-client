import {
    SimplePool,
    Event as NostrEvent,
    getEventHash,
    nip19
} from 'nostr-tools';

// Extend Window interface for NIP-07
declare global {
    interface Window {
        nostr?: {
            getPublicKey(): Promise<string>;
            signEvent(event: NostrEvent): Promise<NostrEvent>;
        };
    }
}

// Default relays - you can customize these
const DEFAULT_RELAYS = [
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://relay.primal.net',
    'wss://relay.nostr.band',
];

export interface Profile {
    pubkey: string;
    name?: string;
    display_name?: string;
    about?: string;
    picture?: string;
    banner?: string;
    website?: string;
    nip05?: string;
    lud16?: string;
    bot?: boolean;
    // Business fields extracted from tags
    email?: string;
    phone?: string;
    location?: string;
    businessType?: string;
    // Event metadata
    tags?: string[][];
}

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    images: string[];
    tags: string[];
    available: boolean;
    created_at: number;
}

class NostrService {
    private pool: SimplePool;
    private relays: string[];

    constructor(relays: string[] = DEFAULT_RELAYS) {
        this.pool = new SimplePool();
        this.relays = relays;
    }

    /**
     * Initialize the service and connect to relays
     */
    async initialize(): Promise<void> {
        // Pool will connect to relays as needed
        console.log('Nostr service initialized with relays:', this.relays);
    }

    /**
     * Get user's public key from NIP-07 extension
     */
    async getPublicKey(): Promise<string> {
        if (!window.nostr) {
            throw new Error('Nostr extension not found. Please install nos2x, Alby, or another NIP-07 extension.');
        }

        return await window.nostr.getPublicKey();
    }

    /**
     * Sign an event using NIP-07 extension
     */
    async signEvent(event: Partial<NostrEvent>): Promise<NostrEvent> {
        if (!window.nostr) {
            throw new Error('Nostr extension not found');
        }

        const pubkey = await this.getPublicKey();

        const completeEvent: NostrEvent = {
            ...event,
            pubkey,
            created_at: event.created_at || Math.floor(Date.now() / 1000),
            tags: event.tags || [],
            content: event.content || '',
            kind: event.kind!,
            id: '',
            sig: '',
        };

        // Generate event ID
        completeEvent.id = getEventHash(completeEvent);

        // Sign with extension
        const signedEvent = await window.nostr.signEvent(completeEvent);
        return signedEvent;
    }

    /**
     * Publish an event to relays
     */
    async publishEvent(event: NostrEvent): Promise<void> {
        const promises = this.pool.publish(this.relays, event);
        await Promise.allSettled(promises);
    }

    /**
     * Get a user's profile (kind 0 event)
     * Fetches all profile events and chooses the most recent one with our business labels
     */
    async getProfile(pubkey: string): Promise<Profile | null> {
        // Get all profile events for this user (not just the latest one)
        const events = await this.pool.querySync(this.relays, {
            kinds: [0],
            authors: [pubkey],
            limit: 100, // Get more events to find our business profile
            until: Math.floor(Date.now() / 1000),
        });

        if (events.length === 0) {
            return null;
        }

        // Sort by created_at to get chronological order (newest first)
        const sortedEvents = events.sort((a, b) => b.created_at - a.created_at);

        // Look for events with our business data first
        let selectedEvent = null;

        // First try to find an event with any of our business data (mixed formats)
        for (const event of sortedEvents) {
            const hasBusinessData = event.tags.some(tag => {
                // Check for NIP-39 "i" tags (email, phone, location)
                if (tag[0] === 'i' && tag[1]) {
                    return tag[1].startsWith('email:') || tag[1].startsWith('phone:') || tag[1].startsWith('location:');
                }
                // Check for label format (business type)
                if (tag[0] === 'l' && tag[2] === 'business.type') {
                    return true;
                }
                return false;
            });
            if (hasBusinessData) {
                selectedEvent = event;
                break;
            }
        }

        // If no business profile found, use the most recent event
        if (!selectedEvent) {
            selectedEvent = sortedEvents[0];
        }

        console.log('Selected profile event:', selectedEvent);

        try {
            const profileData = JSON.parse(selectedEvent.content);
            console.log('Profile content:', profileData);

            // Extract business data from tags using NIP-39 format
            const email = this.extractBusinessField(selectedEvent.tags, 'email');
            const phone = this.extractBusinessField(selectedEvent.tags, 'phone');
            const location = this.extractBusinessField(selectedEvent.tags, 'location');
            const businessType = this.extractBusinessField(selectedEvent.tags, 'business_type');

            return {
                pubkey,
                ...profileData,
                email,
                phone,
                location,
                businessType,
                tags: selectedEvent.tags,
            };
        } catch (error) {
            console.error('Failed to parse profile data:', error);
            return {
                pubkey,
                tags: selectedEvent.tags,
                // Still try to extract business fields from tags using NIP-39 format
                email: this.extractBusinessField(selectedEvent.tags, 'email'),
                phone: this.extractBusinessField(selectedEvent.tags, 'phone'),
                location: this.extractBusinessField(selectedEvent.tags, 'location'),
                businessType: this.extractBusinessField(selectedEvent.tags, 'business_type'),
            };
        }
    }

    /**
     * Extract business field value from event tags using mixed formats
     * - NIP-39 external identities for email, phone, location
     * - Label format for business type
     */
    private extractBusinessField(tags: string[][], fieldType: string): string | undefined {
        // For business type, use the label format
        if (fieldType === 'business_type') {
            const tag = tags.find(tag =>
                tag[0] === 'l' && tag[2] === 'business.type'
            );
            console.log(`Extracting business type from tags:`, tags.filter(t => t[0] === 'l' || t[0] === 'L'));
            console.log(`Found business type tag:`, tag);
            return tag ? tag[1] : undefined;
        }

        // For email, phone, location, use NIP-39 "i" tags
        const tag = tags.find(tag =>
            tag[0] === 'i' && tag[1] && tag[1].startsWith(`${fieldType}:`)
        );
        if (tag && tag[1]) {
            // Extract the value after the claim type prefix
            return tag[1].substring(`${fieldType}:`.length);
        }
        return undefined;
    }

    /**
     * Update user's profile with business data stored in tags
     */
    async updateProfile(
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
        businessData: {
            email?: string;
            phone?: string;
            location?: string;
            businessType?: string;
            categories?: string[];
        } = {}
    ): Promise<void> {
        // Only include standard fields in content
        const standardProfileData = {
            name: profileData.name,
            display_name: profileData.display_name,
            about: profileData.about,
            picture: profileData.picture,
            banner: profileData.banner,
            website: profileData.website,
            nip05: profileData.nip05,
            bot: profileData.bot || false,
        };

        // Build tags for business data using NIP-39 external identities
        const tags: string[][] = [];

        // Add contact info as external identities using NIP-39 "i" tags
        if (businessData.email) {
            tags.push(['i', `email:${businessData.email}`, '']);
        }
        if (businessData.phone) {
            tags.push(['i', `phone:${businessData.phone}`, '']);
        }
        if (businessData.location) {
            tags.push(['i', `location:${businessData.location}`, '']);
        }

        // Business type still uses the label format
        if (businessData.businessType) {
            tags.push(['L', 'business.type']);
            tags.push(['l', businessData.businessType, 'business.type']);
        }

        // Add category tags
        if (businessData.categories && businessData.categories.length > 0) {
            businessData.categories.forEach(category => {
                if (category.trim()) {
                    tags.push(['t', category.trim()]);
                }
            });
        }

        const event = await this.signEvent({
            kind: 0,
            content: JSON.stringify(standardProfileData),
            tags,
        });

        await this.publishEvent(event);
    }

    /**
     * Get products for a user (kind 30023 events - classified listings)
     */
    async getProducts(pubkey: string): Promise<Product[]> {
        const events = await this.pool.querySync(this.relays, {
            kinds: [30023], // NIP-99 Classified Listings
            authors: [pubkey],
        });

        return events.map(event => this.parseProductEvent(event)).filter(Boolean) as Product[];
    }

    /**
     * Create a new product listing
     */
    async createProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<void> {
        // Generate a random ID for the product
        const productId = Math.random().toString(36).substring(2, 15);

        const tags = [
            ['d', productId], // Identifier tag for replaceable events
            ['title', product.name],
            ['summary', product.description],
            ['price', product.price.toString(), product.currency],
            ['location', 'online'], // You can make this configurable
            ['published_at', Math.floor(Date.now() / 1000).toString()],
            ...product.tags.map(tag => ['t', tag]),
            ...product.images.map(img => ['image', img]),
        ];

        const event = await this.signEvent({
            kind: 30023,
            content: product.description,
            tags,
        });

        await this.publishEvent(event);
    }

    /**
     * Delete a product
     */
    async deleteProduct(productId: string): Promise<void> {
        const event = await this.signEvent({
            kind: 5, // Deletion event
            content: 'Deleted product',
            tags: [['e', productId]],
        });

        await this.publishEvent(event);
    }

    /**
     * Parse a product event into a Product object
     */
    private parseProductEvent(event: NostrEvent): Product | null {
        try {
            const tags = event.tags;
            const dTag = tags.find(tag => tag[0] === 'd');
            const titleTag = tags.find(tag => tag[0] === 'title');
            const priceTag = tags.find(tag => tag[0] === 'price');
            const imageTags = tags.filter(tag => tag[0] === 'image');
            const topicTags = tags.filter(tag => tag[0] === 't');

            if (!dTag || !titleTag || !priceTag) {
                return null;
            }

            return {
                id: dTag[1],
                name: titleTag[1],
                description: event.content,
                price: parseFloat(priceTag[1]),
                currency: priceTag[2] || 'sats',
                images: imageTags.map(tag => tag[1]),
                tags: topicTags.map(tag => tag[1]),
                available: true, // You can add logic to determine this
                created_at: event.created_at,
            };
        } catch (error) {
            console.error('Failed to parse product event:', error);
            return null;
        }
    }

    /**
     * Close connections and cleanup
     */
    destroy(): void {
        this.pool.close(this.relays);
    }

    /**
     * Upload file to Blossom server (blossom.band) with Nostr authentication
     */
    async uploadToBlossom(file: File): Promise<string> {
        const BLOSSOM_SERVER = 'https://blossom.band';

        try {
            // Get file hash for the upload authorization
            const fileBuffer = await file.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            // Create authorization event for Blossom (kind 24242)
            const currentTime = Math.floor(Date.now() / 1000);
            const authEvent = await this.signEvent({
                kind: 24242,
                content: `Upload ${file.name}`,
                tags: [
                    ['t', 'upload'],
                    ['name', file.name],
                    ['size', file.size.toString()],
                    ['x', sha256],
                    ['expiration', (currentTime + 600).toString()], // 10 minutes
                ],
            });

            console.log('Auth event for blossom:', authEvent);

            // Try uploading the file directly first
            const response = await fetch(`${BLOSSOM_SERVER}/upload`, {
                method: 'PUT',
                body: file,
                headers: {
                    'Authorization': `Nostr ${btoa(JSON.stringify(authEvent))}`,
                    'Content-Type': file.type || 'application/octet-stream',
                },
            });

            console.log('Blossom response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Blossom error response:', errorText);
                throw new Error(`Upload failed: ${response.status} ${errorText}`);
            }

            // Try to parse as JSON, but handle plain text responses
            let result;
            const responseText = await response.text();
            console.log('Blossom raw response:', responseText);

            try {
                result = JSON.parse(responseText);
                console.log('Blossom parsed result:', result);
            } catch (e) {
                // If not JSON, treat the response as the URL or hash
                console.log('Response is not JSON, treating as URL/hash');
                if (responseText.includes('http')) {
                    return responseText.trim();
                } else {
                    // Assume it's a hash and construct the URL
                    return `${BLOSSOM_SERVER}/${responseText.trim()}`;
                }
            }

            // The response should contain the URL or hash to construct the URL
            if (result.sha256) {
                return `${BLOSSOM_SERVER}/${result.sha256}`;
            } else if (result.url) {
                return result.url;
            } else if (result.download_url) {
                return result.download_url;
            } else {
                // Fallback: construct URL from our calculated hash
                return `${BLOSSOM_SERVER}/${sha256}`;
            }

        } catch (error) {
            console.error('Blossom upload error:', error);
            throw new Error(`Failed to upload to blossom: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

// Create a singleton instance
export const nostrService = new NostrService();

// Utility functions
export const utils = {
    /**
     * Convert npub to hex pubkey
     */
    npubToHex: (npub: string): string => {
        const decoded = nip19.decode(npub);
        if (decoded.type !== 'npub') {
            throw new Error('Invalid npub');
        }
        return decoded.data;
    },

    /**
     * Convert hex pubkey to npub
     */
    hexToNpub: (hex: string): string => {
        return nip19.npubEncode(hex);
    },

    /**
     * Get short pubkey for display
     */
    shortPubkey: (pubkey: string): string => {
        return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
    },

    /**
     * Validate pubkey format
     */
    isValidPubkey: (pubkey: string): boolean => {
        return /^[0-9a-f]{64}$/i.test(pubkey);
    },
};