# 🟣 Nostr Frontend Architecture

## Overview

This application has been re-architected to use **nostr-tools** directly on the frontend, eliminating the need for backend delegation and complex authentication flows. All Nostr operations now happen client-side using NIP-07 browser extensions.

## Architecture Components

### 1. **Nostr Service Layer** (`src/lib/nostr.ts`)
- Manages connections to Nostr relays
- Handles event signing using NIP-07 extensions
- Provides methods for profile and product management
- Uses **SimplePool** for efficient relay communication

### 2. **Authentication Context** (`src/contexts/NostrAuthContext.tsx`)
- Manages user authentication state
- Integrates with NIP-07 browser extensions (nos2x, Alby, etc.)
- Handles profile loading and updating
- Provides global authentication state

### 3. **Product Management Hook** (`src/hooks/useProducts.ts`)
- Custom React hook for product CRUD operations
- Uses NIP-99 Classified Listings (kind 30023) for products
- Provides loading states and error handling
- Automatically syncs with Nostr relays

## Key Features

### ✅ **Direct Nostr Integration**
- No backend delegation required
- Uses standard nostr-tools library
- Compatible with all NIP-07 extensions

### ✅ **Decentralized Data Storage**
- Products stored as Nostr events on relays
- Profiles stored as kind 0 events
- No central database required

### ✅ **Real-time Sync**
- Events are published to multiple relays
- Automatic synchronization across devices
- Resilient to single relay failures

### ✅ **Standard Compliance**
- Follows NIP-07 for browser extension integration
- Uses NIP-99 for classified listings
- Compatible with the broader Nostr ecosystem

## How It Works

### 1. **User Authentication**
```typescript
// User clicks "Sign In" button
const { signIn } = useNostrAuth();
await signIn();

// Behind the scenes:
// 1. Checks for NIP-07 extension
// 2. Gets public key from extension
// 3. Loads existing profile from relays
// 4. Updates authentication state
```

### 2. **Product Creation**
```typescript
// User creates a product
const { createProduct } = useProducts();
await createProduct({
  name: "Cool Product",
  description: "A very cool product",
  price: 1000,
  currency: "sats",
  images: ["https://example.com/image.jpg"],
  tags: ["electronics", "gadgets"]
});

// Behind the scenes:
// 1. Creates NIP-99 classified listing event
// 2. Signs event with user's private key (via extension)
// 3. Publishes to all configured relays
// 4. Updates local state
```

### 3. **Profile Management**
```typescript
// User updates their profile
const { updateProfile } = useNostrAuth();
await updateProfile({
  name: "John Doe",
  about: "Merchant on Nostr",
  picture: "https://example.com/avatar.jpg"
});

// Behind the scenes:
// 1. Creates kind 0 profile event
// 2. Signs with user's key
// 3. Publishes to relays
// 4. Updates local profile state
```

## Configuration

### Default Relays
```typescript
const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net',
  'wss://relay.nostr.band',
];
```

You can customize relays by modifying `src/lib/nostr.ts`.

### Required Browser Extensions
Users need one of these NIP-07 compatible extensions:
- **nos2x** - Simple and lightweight
- **Alby** - Feature-rich with Lightning integration
- **Other NIP-07 extensions**

## Event Types Used

### Profile Events (Kind 0)
```json
{
  "kind": 0,
  "content": "{\"name\":\"John Doe\",\"about\":\"Merchant\"}",
  "tags": []
}
```

### Product Events (Kind 30023 - NIP-99)
```json
{
  "kind": 30023,
  "content": "Product description",
  "tags": [
    ["d", "product-id"],
    ["title", "Product Name"],
    ["price", "1000", "sats"],
    ["image", "https://example.com/image.jpg"],
    ["t", "electronics"]
  ]
}
```

## Benefits of This Architecture

### 🔒 **Enhanced Security**
- Private keys never leave the user's device
- No server-side key management
- Users maintain full control

### 🌐 **True Decentralization**
- No dependency on your servers for data
- Works with any Nostr-compatible client
- Censorship resistant

### 🚀 **Simplified Development**
- No complex authentication flows
- Standard Nostr patterns
- Reduced backend complexity

### 💰 **Cost Effective**
- No database hosting costs
- Minimal server requirements
- Leverages existing Nostr infrastructure

## Migration Notes

### What Was Removed
- ❌ Backend delegation system
- ❌ Server-side Nostr key management
- ❌ Complex authentication APIs
- ❌ Database product storage

### What Was Added
- ✅ Direct nostr-tools integration
- ✅ NIP-07 browser extension support
- ✅ Client-side event signing
- ✅ Decentralized data storage

### For Users
- Must install a NIP-07 browser extension
- All data is stored on Nostr relays
- Can access data from any Nostr client
- Full control over their private keys

## Next Steps

1. **Test with Extensions**: Install nos2x or Alby to test authentication
2. **Customize Relays**: Add your preferred relays to the configuration
3. **Extend Product Schema**: Add more product fields as needed
4. **Implement Search**: Add product discovery across the network
5. **Add Lightning Integration**: Use Alby for Lightning payments

## Support

For issues with:
- **Browser Extensions**: Check extension documentation
- **Nostr Protocol**: See [nostr.com](https://nostr.com)
- **nostr-tools**: See [GitHub repo](https://github.com/nbd-wtf/nostr-tools)

The architecture is now simpler, more secure, and truly decentralized! 🟣 