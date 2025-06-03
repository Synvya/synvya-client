import { apiClient } from './api';

// NIP-26 Delegation event structure
interface DelegationEvent {
    kind: 30078; // NIP-26 delegation event kind
    created_at: number;
    content: string;
    tags: string[][];
    pubkey: string;
}

interface DelegationParams {
    delegateePubkey?: string; // Backend server's public key in hex format
    durationDays?: number; // Default 30 days
    allowedKinds?: number[]; // Event kinds the server can sign
}

class DelegationManager {
    /**
     * Create a delegation event for the backend server
     */
    async createDelegation(
        userPublicKey: string,
        params: DelegationParams & { delegateePubkey: string }
    ): Promise<DelegationEvent> {
        const {
            delegateePubkey,
            durationDays = 30,
            allowedKinds = [0, 1, 30023] // Profile, text notes, product listings
        } = params;

        const now = Math.floor(Date.now() / 1000);
        const expiresAt = now + (durationDays * 24 * 60 * 60); // Convert days to seconds
        const conditions = `kind=${allowedKinds.join(',')}&created_at<${expiresAt}`;

        // Create delegation string according to NIP-26
        const delegationString = `nostr:delegation:${delegateePubkey}:${conditions}`;

        // Sign the delegation string to create the delegation token
        if (!window.nostr) {
            throw new Error('Nostr extension not available');
        }

        let delegationToken: string;

        // Try signMessage first, fallback to signEvent if not available
        try {
            if (window.nostr.signMessage) {
                delegationToken = await window.nostr.signMessage(delegationString);
            } else {
                // Fallback: create a temporary event to sign the delegation string
                const tempEvent = {
                    kind: 1, // Text note
                    created_at: now,
                    content: delegationString,
                    tags: [],
                    pubkey: userPublicKey
                };

                const signedTempEvent = await window.nostr.signEvent(tempEvent);
                delegationToken = signedTempEvent.sig; // Extract signature as delegation token
            }
        } catch (error) {
            throw new Error(`Failed to create delegation token: ${error}`);
        }

        // Create delegation tag according to NIP-26: [delegation, delegator_pubkey, conditions, token]
        const delegationTag = [
            'delegation',
            userPublicKey, // delegator's pubkey (user)
            conditions,
            delegationToken // signature of the delegation string
        ];

        const delegationEvent: DelegationEvent = {
            kind: 30078,
            created_at: now,
            content: `I authorize Synvya to publish my information. The authorization is valid for ${durationDays} days.`,
            tags: [
                ['p', delegateePubkey], // Target server (backend pubkey)
                delegationTag
            ],
            pubkey: userPublicKey
        };

        return delegationEvent;
    }

    /**
     * Sign and submit delegation to the backend
     */
    async submitDelegation(
        userPublicKey: string,
        delegateePubkey: string,
        durationDays: number = 30
    ): Promise<{ success: boolean; error?: string; data?: Record<string, unknown> }> {
        try {
            if (!window.nostr) {
                throw new Error('Nostr extension not available');
            }

            // Create the delegation event
            const delegationEvent = await this.createDelegation(userPublicKey, {
                delegateePubkey,
                durationDays
            });

            console.log('Created delegation event:', delegationEvent);

            // Sign the event using NIP-07
            const signedEvent = await window.nostr.signEvent(delegationEvent);

            console.log('Signed delegation event:', signedEvent);
            console.log('Event kind being sent:', signedEvent.kind);

            // Submit to backend
            const response = await apiClient.authenticatedRequest(
                '/api/delegations/',
                userPublicKey,
                {
                    method: 'POST',
                    body: signedEvent
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
                throw new Error(errorData.detail || `HTTP ${response.status}`);
            }

            const data = await response.json();
            return { success: true, data };

        } catch (error) {
            console.error('Failed to submit delegation:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Get the backend server's public key in hex format
     */
    async getBackendPubkey(userPublicKey: string): Promise<string> {
        const response = await apiClient.authenticatedRequest('/api/public_key', userPublicKey);

        if (!response.ok) {
            throw new Error('Failed to get backend public key');
        }

        const data = await response.json();
        return data.public_key; // Now returns hex format
    }

    private generateRandomToken(): string {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
}

export const delegationManager = new DelegationManager(); 