// NIP-07 Nostr browser extension types
interface NostrWindow {
    nostr?: {
        getPublicKey(): Promise<string>;
        signEvent(event: any): Promise<any>;
        signMessage(message: string): Promise<string>;
        getRelays?(): Promise<Record<string, { read: boolean; write: boolean }>>;
        nip04?: {
            encrypt(pubkey: string, plaintext: string): Promise<string>;
            decrypt(pubkey: string, ciphertext: string): Promise<string>;
        };
    };
}

declare global {
    interface Window extends NostrWindow { }

    interface ImportMetaEnv {
        readonly VITE_API_URL?: string;
    }

    interface ImportMeta {
        readonly env: ImportMetaEnv;
    }
} 