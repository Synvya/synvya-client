// NIP-07 Nostr browser extension types

interface NostrEvent {
    id?: string;
    kind: number;
    tags: string[][];
    content: string;
    created_at: number;
    pubkey: string;
    sig?: string;
}

interface NostrRelays {
    [url: string]: { read: boolean; write: boolean };
}

interface NostrApi {
    getPublicKey(): Promise<string>;
    signEvent(event: NostrEvent): Promise<NostrEvent>;
    signMessage(message: string): Promise<string>;
    getRelays?(): Promise<NostrRelays>;
    nip04?: {
        encrypt(pubkey: string, plaintext: string): Promise<string>;
        decrypt(pubkey: string, ciphertext: string): Promise<string>;
    };
}

declare global {
    interface Window {
        nostr?: NostrApi;
    }

    interface ImportMetaEnv {
        readonly VITE_API_URL?: string;
    }

    interface ImportMeta {
        readonly env: ImportMetaEnv;
    }
} 