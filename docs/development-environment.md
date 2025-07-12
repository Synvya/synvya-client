# Development Environment

## Overview

Synvya is now a **free service** that tracks user signups and terms acceptance for legal compliance. While the service is free to use, we maintain server-side records of terms acceptance in S3 for legal proof.

## Development Commands

### Frontend Only (Recommended for most development)
```bash
npm run dev
```
- Runs Vite development server on `localhost:3000`
- Hot reload for React components
- No serverless functions
- **Fastest startup time**

### Full Stack (For testing terms acceptance)
```bash
npm run dev:netlify
```
- Runs Netlify Dev on `localhost:8888`
- Proxies to Vite frontend (`localhost:3000`)
- Serves serverless functions from `netlify/functions/`
- **Use when testing terms acceptance recording**

## Current Architecture

### Client-Side
- ✅ **Authentication**: Nostr browser extensions
- ✅ **Data Storage**: Direct publishing to Nostr network
- ✅ **Business Logic**: Client-side form processing and visualization

### Server-Side (Legal Compliance)
- ✅ **Terms Acceptance Tracking**: Server-side recording in S3
- ✅ **User Signup Records**: Timestamped legal proof of consent
- ✅ **Health Monitoring**: Basic infrastructure health checks

| Function | Purpose | Local URL | Status |
|----------|---------|-----------|---------|
| `health` | System health check | `/.netlify/functions/health` | ✅ Active |
| `record-terms-acceptance` | Legal compliance tracking | `/.netlify/functions/record-terms-acceptance` | ✅ Active |

## Terms Acceptance Architecture

### Legal Requirements
- **Server-side proof** of terms acceptance for compliance
- **Immutable records** stored in encrypted S3 bucket
- **Comprehensive metadata** including IP, user agent, timestamp

### Data Structure
```json
{
  "users": {
    "public_key_hex": {
      "publicKey": "user_public_key_in_hex",
      "acceptedAt": "2025-01-01T00:00:00.000Z",
      "termsVersion": "1.0",
      "userAgent": "Mozilla/5.0...",
      "ipAddress": "192.168.1.1",
      "recordId": "unique_identifier",
      "metadata": {
        "signupTimestamp": "2025-01-01T00:00:00.000Z",
        "browserLanguage": "en-US",
        "platform": "MacIntel",
        "acceptedVia": "aws-lambda"
      }
    }
  },
  "metadata": {
    "version": "1.0",
    "totalUsers": 1,
    "lastUpdated": "2025-01-01T00:00:00.000Z"
  }
}
```

## Local/Cloud Parity

### Local Development (Netlify Functions)
- **Location**: `netlify/functions/`
- **Data Storage**: Local JSON file in `netlify/functions/data/`
- **URL Pattern**: `http://localhost:8888/.netlify/functions/{function}`

### Cloud Production (AWS Lambda + S3)
- **Location**: `aws-lambda/`
- **Data Storage**: Encrypted S3 bucket (`synvya-user-records-prod`)
- **URL Pattern**: `https://{function-id}.lambda-url.{region}.on.aws/`

## Testing the Environment

### Test Terms Acceptance Recording
```bash
# Start full stack environment
npm run dev:netlify

# Test terms acceptance endpoint (in another terminal)
curl -X POST http://localhost:8888/.netlify/functions/record-terms-acceptance \
  -H "Content-Type: application/json" \
  -d '{
    "publicKey": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    "termsVersion": "1.0"
  }'
```

Expected response:
```json
{
  "message": "Terms acceptance recorded successfully",
  "recordId": "0123456789abcdef..._1672531200000",
  "acceptedAt": "2025-01-01T00:00:00.000Z",
  "termsVersion": "1.0"
}
```

### Test Health Endpoint
```bash
curl http://localhost:8888/.netlify/functions/health
```

## Production Deployment

### S3 Bucket Setup
```bash
# The bucket stores user records with encryption
aws s3 mb s3://synvya-user-records-prod
aws s3api put-bucket-encryption \
    --bucket synvya-user-records-prod \
    --server-side-encryption-configuration \
    '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
```

### Deploy Infrastructure
```bash
./scripts/deploy-lambda-infrastructure.sh
```

### Update Runtime Config
After deployment, update `public/runtime-env.js` with actual Lambda URLs:
```javascript
window.runtimeEnv = {
  healthUrl: 'https://actual-lambda-url.com',
  recordTermsAcceptanceUrl: 'https://actual-lambda-url.com'
};
```

## Environment Variables

### Local Development (.env)
```bash
# No environment variables required for local development
# Local functions use file system storage
```

### Production (AWS)
- `USER_RECORDS_BUCKET`: S3 bucket name for user records
- `AWS_REGION`: AWS region (default: us-east-1)

## Migration Summary

**What Changed**:
- ❌ Removed subscription payment system
- ❌ Removed Zaprite API integration
- ✅ Added server-side terms acceptance tracking
- ✅ Maintained legal compliance records in S3
- ✅ Service is now completely free

**What's Preserved**:
- ✅ Local/cloud development parity
- ✅ User authentication via Nostr
- ✅ Business form and visualization features
- ✅ Server-side infrastructure for compliance

The service is now **free to use** while maintaining **legal proof** of terms acceptance! 